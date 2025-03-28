#!/usr/bin/env python3
"""
Test script for DNA optimization to verify the DNAChisel integration
"""

import json
import os
import sys
import tempfile

# Dummy DNA sequence (a short part of pET-28a)
TEST_SEQUENCE = "ATCCGGATATAAGTTGTGGTGAGCGCCTGATCGACAGGTTTCCCGACTGGAAAGCGGGCAGTGAGCGCAACGCAATTAATGTGAGTTAGCTCACTCATTAGGCACCCC"

def create_test_input():
    """Create a test input file for DNA optimization"""
    test_input = {
        "sequence": TEST_SEQUENCE,
        "constraints": [
            {
                "type": "EnforceGCContent",
                "mini": 0.4,
                "maxi": 0.6,
                "window": 50
            }
        ],
        "objectives": [],
        "isCircular": False
    }
    
    # Create a temporary file
    fd, input_path = tempfile.mkstemp(suffix=".json")
    with os.fdopen(fd, 'w') as f:
        json.dump(test_input, f, indent=2)
        
    return input_path

def main():
    """Run the DNA optimization test"""
    print("Testing DNA optimization script...")
    
    # Create test input file
    input_path = create_test_input()
    print(f"Created test input file: {input_path}")
    
    # Create output path
    fd, output_path = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    print(f"Output will be written to: {output_path}")
    
    # Get path to the optimization script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    optimization_script = os.path.join(script_dir, "dna_optimization.py")
    
    # Run the optimization script
    cmd = f"python3 {optimization_script} {input_path} {output_path}"
    print(f"Running command: {cmd}")
    exit_code = os.system(cmd)
    
    print(f"Command exited with code: {exit_code}")
    
    # Check if output file exists
    if os.path.exists(output_path):
        print(f"Output file exists with size: {os.path.getsize(output_path)} bytes")
        
        # Read and print the output
        try:
            with open(output_path, 'r') as f:
                output_content = f.read()
                print(f"Output content length: {len(output_content)}")
                
                if output_content.strip():
                    result = json.loads(output_content)
                    print("Successfully parsed output JSON")
                    
                    if result.get("success"):
                        print("Optimization successful!")
                        print(f"Optimized sequence length: {len(result.get('optimized_sequence', ''))}")
                    else:
                        print("Optimization failed with error:", result.get("error"))
                else:
                    print("Output file is empty")
        except Exception as e:
            print(f"Error reading or parsing output: {e}")
    else:
        print("Output file was not created")
    
    # Clean up
    try:
        os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)
    except Exception as e:
        print(f"Error cleaning up temporary files: {e}")

if __name__ == "__main__":
    main()
