import os
import re
import ast
import json
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from loguru import logger


@dataclass
class TypeScriptFileInfo:
    """Holds metadata for a analyzed TypeScript/TSX file."""
    imports: List[str]
    exports: List[str]
    classes: List[str]
    functions: List[str]
    file_type: str
    line_count: int = 0


@dataclass
class PythonModuleInfo:
    """Holds metadata for an analyzed Python file."""
    imports: List[str]
    classes: List[str]
    functions: List[str]
    websocket_routes: List[str]
    api_routes: List[str]
    line_count: int = 0


def get_line_count(filepath: str) -> int:
    """
    Returns the number of lines in a given file.
    If the file cannot be read, returns 0.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return sum(1 for _ in f)
    except Exception as e:
        logger.error(f"Could not count lines in {filepath}: {str(e)}")
        return 0


class FullStackArchitectureAnalyzer:
    """
    A class that analyzes both backend (Python) and frontend (TypeScript/TSX) codebases.
    It produces:
      - A tree structure of directories and files
      - Summaries of classes, functions, and routes
      - A Markdown report
      - Logging with high-level statistics
    """

    IGNORED_DIRECTORIES = {'node_modules', '__pycache__', '.git', '.vscode', 'dist'}

    def __init__(self, backend_path: str, frontend_path: str):
        """
        Initialize the analyzer with paths to backend and frontend directories.
        
        :param backend_path: Path to the Python backend codebase
        :param frontend_path: Path to the TypeScript/TSX frontend codebase
        """
        self.backend_path = backend_path
        self.frontend_path = frontend_path
        
        # Store analysis results keyed by relative filepath
        self.python_modules: Dict[str, PythonModuleInfo] = {}
        self.typescript_modules: Dict[str, TypeScriptFileInfo] = {}

    def should_ignore_directory(self, dirpath: str) -> bool:
        """
        Determine if a directory path should be ignored based on known directory names.
        
        :param dirpath: Directory path to check
        :return: True if directory should be ignored, False otherwise
        """
        return any(ignored in dirpath for ignored in self.IGNORED_DIRECTORIES)

    def analyze_typescript_file(self, filepath: str) -> Optional[TypeScriptFileInfo]:
        """
        Perform a more robust analysis of a TypeScript file by:
          - Counting imports (lines starting with 'import ')
          - Export lines (starting with 'export ')
          - Classes (including 'class MyClass' or 'export default class MyClass')
          - Functions (including 'function foo()' and arrow funcs like 'const foo = () =>')
          - Determining a basic 'file_type' based on path segments
          - Counting total lines of code
        
        :param filepath: Absolute path to the TypeScript file
        :return: TypeScriptFileInfo with parsed metadata, or None if there's an error
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()

            # Basic placeholders
            imports = []
            exports = []
            classes = []
            functions = []

            # --- Enhanced detection with simple regex for classes and functions ---
            # NOTE: This is still heuristic-based, not a true parse.
            class_pattern = re.compile(r'(?:export\s+default\s+class\s+|class\s+)([A-Za-z0-9_]+)')
            function_pattern = re.compile(
                r'(?:export\s+default\s+function\s+|export\s+function\s+|function\s+)([A-Za-z0-9_]+)|'
                r'(?:export\s+const\s+|const\s+)([A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>'
            )

            # Split lines for simpler import/export detection
            for line in content.split('\n'):
                stripped = line.strip()
                # Imports
                if stripped.startswith('import '):
                    imports.append(stripped)
                # Exports
                elif stripped.startswith('export '):
                    exports.append(stripped)

            # Find classes
            for match in class_pattern.finditer(content):
                # match groups may contain the class name if found
                class_name = match.group(1)
                if class_name and class_name not in classes:
                    classes.append(class_name)

            # Find functions
            for match in function_pattern.finditer(content):
                # function_pattern has two alternative capturing groups
                func_name_1 = match.group(1)  # for explicit function
                func_name_2 = match.group(2)  # for arrow function
                func_name = func_name_1 if func_name_1 else func_name_2
                if func_name and func_name not in functions:
                    functions.append(func_name)

            # Simple path-based file classification
            file_type = 'unknown'
            if '/game/' in filepath.replace('\\', '/'):
                file_type = 'game'
            elif '/network/' in filepath.replace('\\', '/'):
                file_type = 'network'
            elif '/components/' in filepath.replace('\\', '/'):
                file_type = 'component'
            elif '/utils/' in filepath.replace('\\', '/'):
                file_type = 'utility'

            # Count lines of code
            loc = get_line_count(filepath)

            return TypeScriptFileInfo(
                imports=imports,
                exports=exports,
                classes=classes,
                functions=functions,
                file_type=file_type,
                line_count=loc
            )

        except Exception as e:
            logger.error(f"Error analyzing TypeScript file {filepath}: {str(e)}")
            return None

    def analyze_python_file(self, filepath: str) -> Optional[PythonModuleInfo]:
        """
        Analyzes a Python file by walking the AST to find:
          - Imports
          - Classes
          - Functions
          - WebSocket routes (@websocket)
          - API routes (@get, @post, @put, @delete)
          - Also collects line_count from the file

        :param filepath: Absolute path to a .py file
        :return: PythonModuleInfo with parsed metadata, or None if there's an error
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                source = file.read()
            tree = ast.parse(source)

            imports: List[str] = []
            classes: List[str] = []
            functions: List[str] = []
            websocket_routes: List[str] = []
            api_routes: List[str] = []

            for node in ast.walk(tree):
                # Imports
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    if isinstance(node, ast.Import):
                        imports.extend(n.name for n in node.names)
                    else:
                        module = node.module if node.module else ''
                        imports.extend(f"{module}.{n.name}" for n in node.names)

                # Classes
                elif isinstance(node, ast.ClassDef):
                    classes.append(node.name)

                # Functions
                elif isinstance(node, ast.FunctionDef):
                    functions.append(node.name)
                    # Check decorators for routes
                    for decorator in node.decorator_list:
                        if isinstance(decorator, ast.Call) and hasattr(decorator.func, 'attr'):
                            if decorator.func.attr == 'websocket':
                                websocket_routes.append(node.name)
                            elif decorator.func.attr in ['get', 'post', 'put', 'delete']:
                                api_routes.append(node.name)

            loc = get_line_count(filepath)

            return PythonModuleInfo(
                imports=imports,
                classes=classes,
                functions=functions,
                websocket_routes=websocket_routes,
                api_routes=api_routes,
                line_count=loc
            )

        except Exception as e:
            logger.error(f"Error analyzing Python file {filepath}: {str(e)}")
            return None

    def generate_tree_structure(self, start_path: str, is_frontend: bool = False) -> str:
        """
        Generates a tree-like structure of the project directory, including short
        descriptions for certain known files and line counts. Only includes .py
        files for backend, and .ts/.tsx/.html/.css for frontend.

        :param start_path: Path to the directory to traverse
        :param is_frontend: Whether this directory is the frontend (TS) or backend (PY)
        :return: A string representing the hierarchical structure
        """
        lines: List[str] = []
        start_path = os.path.abspath(start_path)

        for root, dirs, files in os.walk(start_path):
            if self.should_ignore_directory(root):
                continue

            level = root.replace(start_path, '').count(os.sep)
            indent = '    ' * level
            folder_name = os.path.basename(root)

            if level == 0:
                lines.append(folder_name + '/')
            else:
                lines.append(f"{indent}+-- {folder_name}/")

            # Filter out ignored directories in-place
            dirs[:] = [d for d in dirs if not self.should_ignore_directory(d)]
            subindent = '    ' * (level + 1)

            # Filter relevant files
            if is_frontend:
                relevant_exts = ('.ts', '.tsx', '.html', '.css')
            else:
                relevant_exts = ('.py',)

            relevant_files = [f for f in files if f.endswith(relevant_exts)]

            for file_name in relevant_files:
                file_path = os.path.join(root, file_name)
                loc = get_line_count(file_path)

                # Optional small description
                description = ""
                if is_frontend:
                    if file_name == 'renderer.ts':
                        description = "# Canvas rendering with interpolation"
                    elif file_name == 'socket.ts':
                        description = "# WebSocket client implementation"
                    elif file_name == 'main.ts':
                        description = "# Application entry point"
                    elif file_name == 'index.html':
                        description = "# Game canvas container"

                file_line = f"{subindent}+-- {file_name} (LOC: {loc})"
                if description:
                    file_line += f"    {description}"
                lines.append(file_line)

        return '\n'.join(lines)

    def analyze_project(self) -> None:
        """
        Main method to analyze both backend (Python) and frontend (TypeScript) files.
        Populates self.python_modules and self.typescript_modules with metadata.
        """
        # Analyze backend Python files
        for root, _, files in os.walk(self.backend_path):
            if self.should_ignore_directory(root):
                continue
            for file_name in files:
                if file_name.endswith('.py'):
                    filepath = os.path.join(root, file_name)
                    relative_path = os.path.relpath(filepath, self.backend_path)
                    module_info = self.analyze_python_file(filepath)
                    if module_info:
                        self.python_modules[relative_path] = module_info

        # Analyze frontend TypeScript/TSX files
        for root, _, files in os.walk(self.frontend_path):
            if self.should_ignore_directory(root):
                continue
            for file_name in files:
                if file_name.endswith(('.ts', '.tsx')):
                    filepath = os.path.join(root, file_name)
                    relative_path = os.path.relpath(filepath, self.frontend_path)
                    file_info = self.analyze_typescript_file(filepath)
                    if file_info:
                        self.typescript_modules[relative_path] = file_info

    def generate_report(self) -> str:
        """
        Generate a comprehensive Markdown report of the full-stack architecture.
        
        :return: A string with the Markdown report
        """
        report: List[str] = ["# Full-Stack Architecture Report\n"]

        # Project structure
        report.append("## Project Structure\n")
        report.append("### Backend Structure\n```")
        report.append(self.generate_tree_structure(self.backend_path, is_frontend=False))
        report.append("```\n")

        report.append("### Frontend Structure\n```")
        report.append(self.generate_tree_structure(self.frontend_path, is_frontend=True))
        report.append("```\n")

        # Backend Analysis
        report.append("## Backend Analysis\n")
        report.append(f"\nTotal Python files: {len(self.python_modules)}\n")

        total_python_loc = 0
        for filepath, info in self.python_modules.items():
            total_python_loc += info.line_count
            report.append(f"\n### {filepath}\n(LOC: {info.line_count})\n")
            if info.classes:
                report.append("\n#### Classes:\n")
                for class_name in info.classes:
                    report.append(f"- {class_name}\n")
            if info.websocket_routes:
                report.append("\n#### WebSocket Routes:\n")
                for route in info.websocket_routes:
                    report.append(f"- {route}\n")
            if info.api_routes:
                report.append("\n#### API Routes:\n")
                for route in info.api_routes:
                    report.append(f"- {route}\n")

        report.append(f"\n**Total Python LOC:** {total_python_loc}\n")

        # Frontend Analysis
        report.append("\n## Frontend Analysis\n")
        report.append(f"\nTotal TypeScript files: {len(self.typescript_modules)}\n")

        total_ts_loc = 0
        files_by_type: Dict[str, List[Tuple[str, TypeScriptFileInfo]]] = {}
        for filepath, info in self.typescript_modules.items():
            total_ts_loc += info.line_count
            if info.file_type not in files_by_type:
                files_by_type[info.file_type] = []
            files_by_type[info.file_type].append((filepath, info))

        for file_type, files_info in files_by_type.items():
            report.append(f"\n### {file_type.title()} Files:\n")
            for ts_path, ts_info in files_info:
                report.append(f"\n#### {ts_path}\n(LOC: {ts_info.line_count})\n")
                if ts_info.exports:
                    report.append("Exports:\n")
                    for export in ts_info.exports:
                        report.append(f"- {export}\n")
                if ts_info.functions:
                    report.append("Functions:\n")
                    for func in ts_info.functions:
                        report.append(f"- {func}\n")
                if ts_info.classes:
                    report.append("Classes:\n")
                    for cls in ts_info.classes:
                        report.append(f"- {cls}\n")

        report.append(f"\n**Total TypeScript LOC:** {total_ts_loc}\n")

        return "".join(report)

    def log_analysis(self) -> None:
        """
        Logs key architectural information for both backend and frontend.
        """
        logger.info("Starting full-stack architecture analysis...")

        # Backend stats
        total_websocket_routes = sum(len(info.websocket_routes) for info in self.python_modules.values())
        total_api_routes = sum(len(info.api_routes) for info in self.python_modules.values())
        total_python_classes = sum(len(info.classes) for info in self.python_modules.values())

        # Frontend stats
        total_ts_components = sum(
            1 for info in self.typescript_modules.values() if info.file_type == 'component'
        )
        total_ts_functions = sum(len(info.functions) for info in self.typescript_modules.values())

        logger.info(f"Backend: {len(self.python_modules)} Python modules")
        logger.info(f"Backend: {total_websocket_routes} WebSocket routes")
        logger.info(f"Backend: {total_api_routes} API routes")
        logger.info(f"Backend: {total_python_classes} classes")

        logger.info(f"Frontend: {len(self.typescript_modules)} TypeScript modules")
        logger.info(f"Frontend: {total_ts_components} components")
        logger.info(f"Frontend: {total_ts_functions} functions")


def main() -> None:
    """
    Main entry point for the script. Reads environment variables for paths,
    runs analysis, logs summary, and writes a Markdown report to disk.
    """
    backend_dir = os.getenv('BACKEND_DIR', './game_server')
    frontend_dir = os.getenv('FRONTEND_DIR', './game_client')

    analyzer = FullStackArchitectureAnalyzer(backend_dir, frontend_dir)
    analyzer.analyze_project()
    analyzer.log_analysis()

    report = analyzer.generate_report()
    with open('fullstack_architecture_report.md', 'w', encoding='utf-8') as f:
        f.write(report)

    logger.success("Full-stack architecture analysis completed. "
                   "Report saved to 'fullstack_architecture_report.md'")

if __name__ == "__main__":
    main()
