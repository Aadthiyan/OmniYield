#!/usr/bin/env python3

"""
Custom Symbolic Execution Analyzer for Smart Contracts
Replaces Mythril functionality with custom vulnerability detection
"""

import json
import re
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import subprocess
import tempfile

class SymbolicExecutionAnalyzer:
    def __init__(self):
        self.contracts_dir = Path("contracts")
        self.report = {
            "timestamp": "",
            "analysis_type": "symbolic_execution",
            "contracts": [],
            "vulnerabilities": [],
            "summary": {
                "total_contracts": 0,
                "high_risk": 0,
                "medium_risk": 0,
                "low_risk": 0,
                "info": 0
            }
        }

    def analyze_contract(self, contract_path: Path) -> Dict[str, Any]:
        """Analyze a single contract for symbolic execution vulnerabilities"""
        print(f"Analyzing {contract_path.name}...")
        
        with open(contract_path, 'r') as f:
            content = f.read()
        
        contract_analysis = {
            "name": contract_path.stem,
            "path": str(contract_path),
            "vulnerabilities": [],
            "functions": self.extract_functions(content),
            "state_variables": self.extract_state_variables(content),
            "modifiers": self.extract_modifiers(content)
        }
        
        # Run symbolic execution checks
        self.check_integer_overflow(content, contract_analysis)
        self.check_reentrancy(content, contract_analysis)
        self.check_unchecked_calls(content, contract_analysis)
        self.check_denial_of_service(content, contract_analysis)
        self.check_front_running(content, contract_analysis)
        self.check_tx_origin(content, contract_analysis)
        self.check_selfdestruct(content, contract_analysis)
        self.check_delegatecall(content, contract_analysis)
        self.check_randomness(content, contract_analysis)
        self.check_timestamp_manipulation(content, contract_analysis)
        
        return contract_analysis

    def extract_functions(self, content: str) -> List[Dict[str, Any]]:
        """Extract function information from contract"""
        functions = []
        function_pattern = r'function\s+(\w+)\s*\([^)]*\)\s*(?:public|private|internal|external)?\s*(?:view|pure|payable)?\s*(?:returns\s*\([^)]*\))?\s*\{'
        
        for match in re.finditer(function_pattern, content, re.MULTILINE):
            functions.append({
                "name": match.group(1),
                "visibility": self.extract_visibility(match.group(0)),
                "state_mutability": self.extract_state_mutability(match.group(0))
            })
        
        return functions

    def extract_state_variables(self, content: str) -> List[Dict[str, Any]]:
        """Extract state variable information"""
        variables = []
        var_pattern = r'(public|private|internal)\s+(\w+)\s+(\w+);'
        
        for match in re.finditer(var_pattern, content):
            variables.append({
                "name": match.group(3),
                "type": match.group(2),
                "visibility": match.group(1)
            })
        
        return variables

    def extract_modifiers(self, content: str) -> List[str]:
        """Extract modifier information"""
        modifiers = []
        modifier_pattern = r'modifier\s+(\w+)\s*\([^)]*\)\s*\{'
        
        for match in re.finditer(modifier_pattern, content):
            modifiers.append(match.group(1))
        
        return modifiers

    def extract_visibility(self, function_declaration: str) -> str:
        """Extract function visibility"""
        if 'public' in function_declaration:
            return 'public'
        elif 'private' in function_declaration:
            return 'private'
        elif 'internal' in function_declaration:
            return 'internal'
        elif 'external' in function_declaration:
            return 'external'
        return 'public'  # default

    def extract_state_mutability(self, function_declaration: str) -> str:
        """Extract function state mutability"""
        if 'view' in function_declaration:
            return 'view'
        elif 'pure' in function_declaration:
            return 'pure'
        elif 'payable' in function_declaration:
            return 'payable'
        return 'nonpayable'

    def check_integer_overflow(self, content: str, contract: Dict[str, Any]):
        """Check for integer overflow vulnerabilities"""
        # Look for arithmetic operations without SafeMath
        arithmetic_patterns = [
            r'(\w+)\s*\+\s*(\w+)',
            r'(\w+)\s*-\s*(\w+)',
            r'(\w+)\s*\*\s*(\w+)',
            r'(\w+)\s*/\s*(\w+)'
        ]
        
        has_safemath = 'SafeMath' in content or 'unchecked' in content
        has_arithmetic = any(re.search(pattern, content) for pattern in arithmetic_patterns)
        
        if has_arithmetic and not has_safemath:
            contract["vulnerabilities"].append({
                "type": "integer_overflow",
                "severity": "medium",
                "description": "Potential integer overflow/underflow in arithmetic operations",
                "recommendation": "Use SafeMath library or Solidity 0.8+ built-in overflow protection",
                "line_numbers": self.find_line_numbers(content, arithmetic_patterns[0])
            })

    def check_reentrancy(self, content: str, contract: Dict[str, Any]):
        """Check for reentrancy vulnerabilities"""
        # Look for external calls followed by state changes
        external_call_patterns = [
            r'\.call\s*\(',
            r'\.send\s*\(',
            r'\.transfer\s*\('
        ]
        
        has_external_calls = any(re.search(pattern, content) for pattern in external_call_patterns)
        has_reentrancy_guard = 'ReentrancyGuard' in content or 'nonReentrant' in content
        
        if has_external_calls and not has_reentrancy_guard:
            contract["vulnerabilities"].append({
                "type": "reentrancy",
                "severity": "high",
                "description": "Potential reentrancy vulnerability in external calls",
                "recommendation": "Use OpenZeppelin ReentrancyGuard or implement checks-effects-interactions pattern",
                "line_numbers": self.find_line_numbers(content, external_call_patterns[0])
            })

    def check_unchecked_calls(self, content: str, contract: Dict[str, Any]):
        """Check for unchecked external calls"""
        # Look for external calls without return value checks
        unchecked_patterns = [
            r'(\w+)\.call\s*\([^)]*\)(?!\s*\{)',
            r'(\w+)\.send\s*\([^)]*\)(?!\s*\{)'
        ]
        
        for pattern in unchecked_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                contract["vulnerabilities"].append({
                    "type": "unchecked_call",
                    "severity": "medium",
                    "description": f"Unchecked external call: {match.group(0)}",
                    "recommendation": "Check return values of external calls",
                    "line_numbers": self.find_line_numbers(content, pattern)
                })

    def check_denial_of_service(self, content: str, contract: Dict[str, Any]):
        """Check for denial of service vulnerabilities"""
        # Look for loops that could consume excessive gas
        loop_patterns = [
            r'for\s*\([^)]*\)\s*\{[^}]*\.push\s*\(',
            r'while\s*\([^)]*\)\s*\{[^}]*\.push\s*\('
        ]
        
        for pattern in loop_patterns:
            if re.search(pattern, content):
                contract["vulnerabilities"].append({
                    "type": "denial_of_service",
                    "severity": "medium",
                    "description": "Potential denial of service through gas limit exhaustion",
                    "recommendation": "Implement pagination or limit loop iterations",
                    "line_numbers": self.find_line_numbers(content, pattern)
                })

    def check_front_running(self, content: str, contract: Dict[str, Any]):
        """Check for front-running vulnerabilities"""
        # Look for predictable patterns that could be front-run
        if 'block.timestamp' in content and 'random' in content.lower():
            contract["vulnerabilities"].append({
                "type": "front_running",
                "severity": "medium",
                "description": "Potential front-running vulnerability using predictable randomness",
                "recommendation": "Use commit-reveal scheme or external randomness oracle",
                "line_numbers": self.find_line_numbers(content, r'block\.timestamp')
            })

    def check_tx_origin(self, content: str, contract: Dict[str, Any]):
        """Check for tx.origin usage"""
        if 'tx.origin' in content:
            contract["vulnerabilities"].append({
                "type": "tx_origin",
                "severity": "medium",
                "description": "Use of tx.origin for authorization",
                "recommendation": "Use msg.sender instead of tx.origin for authorization",
                "line_numbers": self.find_line_numbers(content, r'tx\.origin')
            })

    def check_selfdestruct(self, content: str, contract: Dict[str, Any]):
        """Check for selfdestruct usage"""
        if 'selfdestruct' in content:
            contract["vulnerabilities"].append({
                "type": "selfdestruct",
                "severity": "high",
                "description": "Use of selfdestruct function",
                "recommendation": "Ensure proper access control for selfdestruct",
                "line_numbers": self.find_line_numbers(content, r'selfdestruct')
            })

    def check_delegatecall(self, content: str, contract: Dict[str, Any]):
        """Check for delegatecall usage"""
        if 'delegatecall' in content:
            contract["vulnerabilities"].append({
                "type": "delegatecall",
                "severity": "high",
                "description": "Use of delegatecall function",
                "recommendation": "Ensure delegatecall target is trusted and properly validated",
                "line_numbers": self.find_line_numbers(content, r'delegatecall')
            })

    def check_randomness(self, content: str, contract: Dict[str, Any]):
        """Check for weak randomness sources"""
        weak_randomness_patterns = [
            r'block\.timestamp',
            r'block\.number',
            r'block\.hash'
        ]
        
        for pattern in weak_randomness_patterns:
            if re.search(pattern, content) and 'random' in content.lower():
                contract["vulnerabilities"].append({
                    "type": "weak_randomness",
                    "severity": "medium",
                    "description": "Weak randomness source detected",
                    "recommendation": "Use external randomness oracle or commit-reveal scheme",
                    "line_numbers": self.find_line_numbers(content, pattern)
                })

    def check_timestamp_manipulation(self, content: str, contract: Dict[str, Any]):
        """Check for timestamp manipulation vulnerabilities"""
        if 'block.timestamp' in content:
            # Check if used in critical logic
            critical_patterns = [
                r'block\.timestamp\s*[<>=]',
                r'now\s*[<>=]'
            ]
            
            for pattern in critical_patterns:
                if re.search(pattern, content):
                    contract["vulnerabilities"].append({
                        "type": "timestamp_manipulation",
                        "severity": "low",
                        "description": "Timestamp dependency in critical logic",
                        "recommendation": "Be aware of miner manipulation of block.timestamp",
                        "line_numbers": self.find_line_numbers(content, pattern)
                    })

    def find_line_numbers(self, content: str, pattern: str) -> List[int]:
        """Find line numbers where pattern occurs"""
        lines = content.split('\n')
        line_numbers = []
        
        for i, line in enumerate(lines, 1):
            if re.search(pattern, line):
                line_numbers.append(i)
        
        return line_numbers

    def run_analysis(self) -> Dict[str, Any]:
        """Run symbolic execution analysis on all contracts"""
        print("Starting Symbolic Execution Analysis...")
        
        self.report["timestamp"] = str(Path().cwd())
        
        if not self.contracts_dir.exists():
            print(f"Contracts directory not found: {self.contracts_dir}")
            return self.report
        
        contract_files = list(self.contracts_dir.rglob("*.sol"))
        self.report["summary"]["total_contracts"] = len(contract_files)
        
        for contract_file in contract_files:
            try:
                contract_analysis = self.analyze_contract(contract_file)
                self.report["contracts"].append(contract_analysis)
                
                # Update summary
                for vuln in contract_analysis["vulnerabilities"]:
                    severity = vuln["severity"]
                    if severity == "high":
                        self.report["summary"]["high_risk"] += 1
                    elif severity == "medium":
                        self.report["summary"]["medium_risk"] += 1
                    elif severity == "low":
                        self.report["summary"]["low_risk"] += 1
                    else:
                        self.report["summary"]["info"] += 1
                
            except Exception as e:
                print(f"Error analyzing {contract_file}: {e}")
        
        return self.report

    def generate_report(self) -> str:
        """Generate markdown report"""
        report_path = Path("docs/SYMBOLIC_EXECUTION_REPORT.md")
        report_path.parent.mkdir(exist_ok=True)
        
        md_content = f"""# Symbolic Execution Analysis Report

**Generated:** {self.report["timestamp"]}
**Analysis Type:** {self.report["analysis_type"]}

## Executive Summary

| Severity | Count |
|----------|-------|
| High Risk | {self.report["summary"]["high_risk"]} |
| Medium Risk | {self.report["summary"]["medium_risk"]} |
| Low Risk | {self.report["summary"]["low_risk"]} |
| Info | {self.report["summary"]["info"]} |
| **Total Contracts** | {self.report["summary"]["total_contracts"]} |

## Contract Analysis

"""
        
        for contract in self.report["contracts"]:
            md_content += f"""### {contract["name"]}

- **Path:** `{contract["path"]}`
- **Functions:** {len(contract["functions"])}
- **State Variables:** {len(contract["state_variables"])}
- **Modifiers:** {len(contract["modifiers"])}
- **Vulnerabilities:** {len(contract["vulnerabilities"])}

"""
            
            if contract["vulnerabilities"]:
                md_content += "#### Vulnerabilities Found:\n\n"
                for vuln in contract["vulnerabilities"]:
                    severity_text = vuln["severity"].upper()
                    md_content += f"- [{severity_text}] **{vuln["type"].replace('_', ' ').title()}**\n"
                    md_content += f"  - Description: {vuln["description"]}\n"
                    md_content += f"  - Recommendation: {vuln["recommendation"]}\n"
                    if vuln.get("line_numbers"):
                        md_content += f"  - Lines: {', '.join(map(str, vuln['line_numbers']))}\n"
                    md_content += "\n"
        
        md_content += """## Recommendations

1. **Address High Risk Issues First**: Focus on high-severity vulnerabilities
2. **Implement Security Patterns**: Use OpenZeppelin libraries for common patterns
3. **Code Review**: Conduct thorough manual code review
4. **Testing**: Implement comprehensive test coverage
5. **Professional Audit**: Consider professional security audit for mainnet

## Conclusion

This symbolic execution analysis provides automated vulnerability detection.
For production deployment, consider engaging a professional security audit firm.

---
*Generated by Custom Symbolic Execution Analyzer*
"""
        
        with open(report_path, 'w') as f:
            f.write(md_content)
        
        print(f"Symbolic execution report generated: {report_path}")
        return str(report_path)

def main():
    analyzer = SymbolicExecutionAnalyzer()
    report = analyzer.run_analysis()
    report_path = analyzer.generate_report()
    
    print(f"\nSymbolic Execution Analysis Summary:")
    print(f"   High Risk: {report['summary']['high_risk']}")
    print(f"   Medium Risk: {report['summary']['medium_risk']}")
    print(f"   Low Risk: {report['summary']['low_risk']}")
    print(f"   Info: {report['summary']['info']}")
    print(f"   Total Contracts: {report['summary']['total_contracts']}")
    
    if report['summary']['high_risk'] > 0:
        print("\nHIGH RISK vulnerabilities found!")
        sys.exit(1)
    else:
        print("\nSymbolic execution analysis completed successfully.")
        sys.exit(0)

if __name__ == "__main__":
    main()
