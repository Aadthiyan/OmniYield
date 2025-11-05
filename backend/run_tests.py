#!/usr/bin/env python3
"""
Comprehensive test runner for the DeFi Yield Aggregator backend
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print("✅ SUCCESS")
        if result.stdout:
            print("STDOUT:", result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print("❌ FAILED")
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description="Run DeFi Yield Aggregator tests")
    parser.add_argument("--type", choices=["unit", "integration", "all"], default="all",
                       help="Type of tests to run")
    parser.add_argument("--coverage", action="store_true", default=True,
                       help="Run with coverage")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Verbose output")
    parser.add_argument("--html", action="store_true",
                       help="Generate HTML coverage report")
    
    args = parser.parse_args()
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print("🚀 Starting DeFi Yield Aggregator Test Suite")
    print(f"Working directory: {os.getcwd()}")
    
    # Install dependencies
    if not run_command("pip install -r requirements.txt", "Installing dependencies"):
        print("❌ Failed to install dependencies")
        return 1
    
    # Set up environment variables
    os.environ["TESTING"] = "true"
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"
    os.environ["REDIS_URL"] = "redis://localhost:6379/1"
    
    # Build test command
    test_cmd = "pytest"
    
    if args.verbose:
        test_cmd += " -v"
    
    if args.coverage:
        test_cmd += " --cov=app --cov-report=term-missing"
        if args.html:
            test_cmd += " --cov-report=html"
        test_cmd += " --cov-fail-under=80"
    
    # Add test type filters
    if args.type == "unit":
        test_cmd += " -m 'not integration and not contract'"
    elif args.type == "integration":
        test_cmd += " -m 'integration or contract'"
    
    # Add test files
    test_cmd += " tests/"
    
    # Run tests
    success = run_command(test_cmd, f"Running {args.type} tests")
    
    if success:
        print("\n🎉 All tests passed!")
        
        # Show coverage summary
        if args.coverage:
            print("\n📊 Coverage Summary:")
            run_command("coverage report", "Coverage report")
            
            if args.html:
                print("\n📄 HTML coverage report generated in htmlcov/index.html")
        
        return 0
    else:
        print("\n💥 Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
