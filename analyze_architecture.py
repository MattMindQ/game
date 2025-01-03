import os
import ast
import json
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from loguru import logger

@dataclass
class TypeScriptFileInfo:
    imports: List[str]
    exports: List[str]
    classes: List[str]
    functions: List[str]
    file_type: str

@dataclass
class PythonModuleInfo:
    imports: List[str]
    classes: List[str]
    functions: List[str]
    websocket_routes: List[str]
    api_routes: List[str]

class FullStackArchitectureAnalyzer:
    IGNORED_DIRECTORIES = {'node_modules', '__pycache__', '.git', '.vscode', 'dist'}
    
    def __init__(self, backend_path: str, frontend_path: str):
        self.backend_path = backend_path
        self.frontend_path = frontend_path
        self.python_modules: Dict[str, PythonModuleInfo] = {}
        self.typescript_modules: Dict[str, TypeScriptFileInfo] = {}

    def should_ignore_directory(self, dirpath: str) -> bool:
        """Check if directory should be ignored."""
        return any(ignored in dirpath for ignored in self.IGNORED_DIRECTORIES)

    def analyze_typescript_file(self, filepath: str) -> Optional[TypeScriptFileInfo]:
        """Basic TypeScript file analysis."""
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
                
            imports = []
            exports = []
            classes = []
            functions = []
            
            for line in content.split('\n'):
                line = line.strip()
                if line.startswith('import '):
                    imports.append(line)
                elif line.startswith('export '):
                    exports.append(line)
                elif line.startswith('class '):
                    classes.append(line.split(' ')[1].split('{')[0].strip())
                elif line.startswith('function ') or 'const' in line and '=>' in line:
                    if 'function' in line:
                        func_name = line.split('function ')[1].split('(')[0].strip()
                    else:
                        func_name = line.split('const ')[1].split('=')[0].strip()
                    functions.append(func_name)

            file_type = 'unknown'
            if '/game/' in filepath:
                file_type = 'game'
            elif '/network/' in filepath:
                file_type = 'network'
            elif '/components/' in filepath:
                file_type = 'component'
            elif '/utils/' in filepath:
                file_type = 'utility'

            return TypeScriptFileInfo(
                imports=imports,
                exports=exports,
                classes=classes,
                functions=functions,
                file_type=file_type
            )

        except Exception as e:
            logger.error(f"Error analyzing TypeScript file {filepath}: {str(e)}")
            return None

    def analyze_python_file(self, filepath: str) -> Optional[PythonModuleInfo]:
        """Analyzes a Python file."""
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                tree = ast.parse(file.read())

            imports = []
            classes = []
            functions = []
            websocket_routes = []
            api_routes = []

            for node in ast.walk(tree):
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    if isinstance(node, ast.Import):
                        imports.extend(n.name for n in node.names)
                    else:
                        module = node.module if node.module else ''
                        imports.extend(f"{module}.{n.name}" for n in node.names)
                
                elif isinstance(node, ast.ClassDef):
                    classes.append(node.name)
                
                elif isinstance(node, ast.FunctionDef):
                    functions.append(node.name)
                    
                    for decorator in node.decorator_list:
                        if isinstance(decorator, ast.Call):
                            if hasattr(decorator.func, 'attr'):
                                if decorator.func.attr == 'websocket':
                                    websocket_routes.append(node.name)
                                elif decorator.func.attr in ['get', 'post', 'put', 'delete']:
                                    api_routes.append(node.name)

            return PythonModuleInfo(
                imports=imports,
                classes=classes,
                functions=functions,
                websocket_routes=websocket_routes,
                api_routes=api_routes
            )

        except Exception as e:
            logger.error(f"Error analyzing Python file {filepath}: {str(e)}")
            return None

    def generate_tree_structure(self, start_path: str, is_frontend: bool = False) -> str:
        """Generates a tree-like structure of the project."""
        tree = []
        start_path = os.path.abspath(start_path)
        
        for root, dirs, files in os.walk(start_path):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if not self.should_ignore_directory(d)]
            
            level = root.replace(start_path, '').count(os.sep)
            indent = '    ' * level
            folder_name = os.path.basename(root)
            
            if level == 0:
                tree.append(folder_name + '/')
            else:
                tree.append(f"{indent}+-- {folder_name}/")
            
            subindent = '    ' * (level + 1)
            
            relevant_files = [f for f in files if 
                            (is_frontend and f.endswith(('.ts', '.tsx', '.html', '.css'))) or
                            (not is_frontend and f.endswith('.py'))]
            
            for file in relevant_files:
                description = ""
                if is_frontend:
                    if file in ['renderer.ts']:
                        description = "# Canvas rendering with interpolation"
                    elif file in ['socket.ts']:
                        description = "# WebSocket client implementation"
                    elif file == 'main.ts':
                        description = "# Application entry point"
                    elif file == 'index.html':
                        description = "# Game canvas container"
                
                file_line = f"{subindent}+-- {file}"
                if description:
                    file_line += f"    {description}"
                tree.append(file_line)
        
        return '\n'.join(tree)

    def analyze_project(self):
        """Analyzes both frontend and backend parts of the project."""
        # Analyze backend Python files
        for root, _, files in os.walk(self.backend_path):
            if self.should_ignore_directory(root):
                continue
                
            for file in files:
                if file.endswith('.py'):
                    filepath = os.path.join(root, file)
                    relative_path = os.path.relpath(filepath, self.backend_path)
                    module_info = self.analyze_python_file(filepath)
                    if module_info:
                        self.python_modules[relative_path] = module_info

        # Analyze frontend TypeScript files
        for root, _, files in os.walk(self.frontend_path):
            if self.should_ignore_directory(root):
                continue
                
            for file in files:
                if file.endswith(('.ts', '.tsx')):
                    filepath = os.path.join(root, file)
                    relative_path = os.path.relpath(filepath, self.frontend_path)
                    file_info = self.analyze_typescript_file(filepath)
                    if file_info:
                        self.typescript_modules[relative_path] = file_info

    def generate_report(self) -> str:
        """Generates a comprehensive markdown report of the full-stack architecture."""
        report = ["# Full-Stack Architecture Report\n"]
        
        # Project Structure
        report.append("## Project Structure\n")
        report.append("### Backend Structure\n```")
        report.append(self.generate_tree_structure(self.backend_path))
        report.append("```\n")
        
        report.append("### Frontend Structure\n```")
        report.append(self.generate_tree_structure(self.frontend_path, is_frontend=True))
        report.append("```\n")
        
        # Backend Analysis
        report.append("## Backend Analysis\n")
        report.append(f"\nTotal Python files: {len(self.python_modules)}\n")
        
        for filepath, info in self.python_modules.items():
            report.append(f"\n### {filepath}\n")
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
        
        # Frontend Analysis
        report.append("\n## Frontend Analysis\n")
        report.append(f"\nTotal TypeScript files: {len(self.typescript_modules)}\n")
        
        # Group files by type
        files_by_type = {}
        for filepath, info in self.typescript_modules.items():
            if info.file_type not in files_by_type:
                files_by_type[info.file_type] = []
            files_by_type[info.file_type].append((filepath, info))

        for file_type, files in files_by_type.items():
            report.append(f"\n### {file_type.title()} Files:\n")
            for filepath, info in files:
                report.append(f"\n#### {filepath}\n")
                if info.exports:
                    report.append("Exports:\n")
                    for export in info.exports:
                        report.append(f"- {export}\n")
                if info.functions:
                    report.append("Functions:\n")
                    for func in info.functions:
                        report.append(f"- {func}\n")

        return "".join(report)

    def log_analysis(self):
        """Logs key architectural information."""
        logger.info("Starting full-stack architecture analysis...")
        
        # Backend stats
        total_websocket_routes = sum(
            len(info.websocket_routes) for info in self.python_modules.values()
        )
        total_api_routes = sum(
            len(info.api_routes) for info in self.python_modules.values()
        )
        total_python_classes = sum(
            len(info.classes) for info in self.python_modules.values()
        )
        
        # Frontend stats
        total_ts_components = sum(
            1 for info in self.typescript_modules.values() if info.file_type == 'component'
        )
        total_ts_functions = sum(
            len(info.functions) for info in self.typescript_modules.values()
        )
        
        logger.info(f"Backend: {len(self.python_modules)} Python modules")
        logger.info(f"Backend: {total_websocket_routes} WebSocket routes")
        logger.info(f"Backend: {total_api_routes} API routes")
        logger.info(f"Backend: {total_python_classes} classes")
        
        logger.info(f"Frontend: {len(self.typescript_modules)} TypeScript modules")
        logger.info(f"Frontend: {total_ts_components} components")
        logger.info(f"Frontend: {total_ts_functions} functions")

def main():
    backend_dir = os.getenv('BACKEND_DIR', './game_server')
    frontend_dir = os.getenv('FRONTEND_DIR', './game_client')
    
    analyzer = FullStackArchitectureAnalyzer(backend_dir, frontend_dir)
    analyzer.analyze_project()
    analyzer.log_analysis()
    
    report = analyzer.generate_report()
    with open('fullstack_architecture_report.md', 'w', encoding='utf-8') as f:
        f.write(report)
    
    logger.success("Full-stack architecture analysis completed. Report saved to 'fullstack_architecture_report.md'")

if __name__ == "__main__":
    main()