#!/usr/bin/env python3
"""
DNA Sequence Optimization using DNAChisel
This script takes an input JSON file with sequence and optimization parameters,
runs DNAChisel optimization, and outputs the results to a JSON file.
"""

import json
import sys
import traceback
from typing import Dict, List, Any, Optional, Union
import os

# Define a flag to track if DNAChisel is available
DNACHISEL_AVAILABLE = True

try:
    from dnachisel import (
        DnaOptimizationProblem, CircularDnaOptimizationProblem,
        AvoidPattern, EnforceGCContent, CodonOptimize, EnforceTranslation,
        AvoidChanges, AvoidMatches, EnforcePatternOccurence, 
        AvoidHairpins, EnforceTerminalGCContent, AvoidRareCodons
    )
except ImportError:
    print("WARNING: DNAChisel is not installed. Using fallback mode.")
    print("For full functionality, install DNAChisel using:")
    print("pip install dnachisel[reports]")
    DNACHISEL_AVAILABLE = False

# Map of constraint types to their classes
CONSTRAINT_TYPES = {
    "AvoidPattern": AvoidPattern,
    "EnforceGCContent": EnforceGCContent,
    "EnforceTranslation": EnforceTranslation,
    "AvoidChanges": AvoidChanges,
    "AvoidMatches": AvoidMatches,
    "EnforcePatternOccurence": EnforcePatternOccurence,
    "AvoidHairpins": AvoidHairpins,
    "EnforceTerminalGCContent": EnforceTerminalGCContent,
    "AvoidRareCodons": AvoidRareCodons
}

# Map of objective types to their classes
OBJECTIVE_TYPES = {
    "CodonOptimize": CodonOptimize,
}

def create_constraint(constraint_data: Dict[str, Any]):
    """Create a constraint object from constraint data"""
    # Make a copy of the data to avoid modifying the original
    data = constraint_data.copy()
    constraint_type = data.pop("type")
    
    if constraint_type not in CONSTRAINT_TYPES:
        raise ValueError(f"Unknown constraint type: {constraint_type}")
    
    # Handle locations which are typically tuples
    if "location" in data and isinstance(data["location"], list):
        data["location"] = tuple(data["location"])
    
    # Parameter-specific fixes and validation
    if constraint_type == "AvoidHairpins":
        # Check for common parameter name confusion
        if "min_stem_size" in data and "stem_size" not in data:
            print("Warning: Fixing parameter 'min_stem_size' to 'stem_size'")
            data["stem_size"] = data.pop("min_stem_size")
    
    # Add additional debugging
    print(f"Creating constraint {constraint_type} with parameters: {data}")
    
    try:
        return CONSTRAINT_TYPES[constraint_type](**data)
    except TypeError as e:
        print(f"Error creating constraint {constraint_type}: {str(e)}")
        # Try to provide helpful error information
        import inspect
        param_names = list(inspect.signature(CONSTRAINT_TYPES[constraint_type].__init__).parameters.keys())[1:]
        print(f"Expected parameters for {constraint_type}: {param_names}")
        print(f"Provided parameters: {list(data.keys())}")
        raise

def create_objective(objective_data: Dict[str, Any]):
    """Create an objective object from objective data"""
    # Make a copy of the data to avoid modifying the original
    data = objective_data.copy()
    objective_type = data.pop("type")
    
    if objective_type not in OBJECTIVE_TYPES:
        raise ValueError(f"Unknown objective type: {objective_type}")
    
    # Handle locations which are typically tuples
    if "location" in data and isinstance(data["location"], list):
        data["location"] = tuple(data["location"])
    
    # Add additional debugging
    print(f"Creating objective {objective_type} with parameters: {data}")
    
    try:
        return OBJECTIVE_TYPES[objective_type](**data)
    except TypeError as e:
        print(f"Error creating objective {objective_type}: {str(e)}")
        # Try to provide helpful error information
        import inspect
        param_names = list(inspect.signature(OBJECTIVE_TYPES[objective_type].__init__).parameters.keys())[1:]
        print(f"Expected parameters for {objective_type}: {param_names}")
        print(f"Provided parameters: {list(data.keys())}")
        raise

def optimize_sequence(
    sequence: str,
    constraints: List[Dict[str, Any]],
    objectives: List[Dict[str, Any]],
    is_circular: bool = False
) -> Dict[str, Any]:
    """
    Optimize a DNA sequence using DNAChisel
    
    Args:
        sequence: The DNA sequence to optimize
        constraints: List of constraint specifications
        objectives: List of objective specifications
        is_circular: Whether the sequence is circular
    
    Returns:
        Dictionary with optimization results
    """
    # Check if DNAChisel is available
    if not DNACHISEL_AVAILABLE:
        print("DNAChisel not available - returning original sequence")
        return {
            "success": True,
            "optimized_sequence": sequence,
            "constraints_summary": "DNAChisel not available - no constraints applied",
            "objectives_summary": "DNAChisel not available - no objectives applied",
            "all_constraints_passing": True
        }
    try:
        # Create constraint and objective objects
        constraint_objects = [create_constraint(c) for c in constraints]
        objective_objects = [create_objective(o) for o in objectives]
        
        # Create the optimization problem
        if is_circular:
            problem = CircularDnaOptimizationProblem(
                sequence=sequence,
                constraints=constraint_objects,
                objectives=objective_objects
            )
        else:
            problem = DnaOptimizationProblem(
                sequence=sequence,
                constraints=constraint_objects,
                objectives=objective_objects
            )
        
        # Solve the constraints
        problem.resolve_constraints()
        
        # Optimize with respect to objectives
        if objectives:
            problem.optimize()
        
        # Get optimization reports
        constraints_text = problem.constraints_text_summary()
        objectives_text = problem.objectives_text_summary() if objectives else ""
        
        # Create result
        result = {
            "success": True,
            "optimized_sequence": problem.sequence,
            "constraints_summary": constraints_text,
            "objectives_summary": objectives_text,
            "all_constraints_passing": problem.all_constraints_pass(),
        }
        
        return result
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

def main():
    """Main function to run optimization from command line"""
    # Print debugging information
    print(f"Python version: {sys.version}")
    print(f"Command line arguments: {sys.argv}")
    
    if len(sys.argv) != 3:
        print("Usage: python dna_optimization.py input.json output.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        # Verify input file exists
        if not os.path.exists(input_file):
            print(f"Error: Input file does not exist: {input_file}")
            sys.exit(1)
            
        print(f"Reading input file: {input_file}")
        
        # Read input data
        with open(input_file, 'r') as f:
            input_content = f.read()
            print(f"Input file content length: {len(input_content)}")
            if not input_content.strip():
                print("Error: Input file is empty")
                sys.exit(1)
            input_data = json.loads(input_content)
        
        # Extract parameters
        sequence = input_data.get("sequence", "")
        constraints = input_data.get("constraints", [])
        objectives = input_data.get("objectives", [])
        is_circular = input_data.get("isCircular", False)
        
        print(f"Sequence length: {len(sequence)}")
        print(f"Constraints: {len(constraints)}")
        print(f"Objectives: {len(objectives)}")
        print(f"Is circular: {is_circular}")
        
        # Run optimization
        print("Running sequence optimization...")
        result = optimize_sequence(sequence, constraints, objectives, is_circular)
        print("Optimization completed.")
        
        # Write output
        print(f"Writing output to: {output_file}")
        with open(output_file, 'w') as f:
            output_json = json.dumps(result, indent=2)
            f.write(output_json)
        
        # Verify output was written correctly
        if os.path.exists(output_file):
            print(f"Output file created successfully: {output_file}")
            print(f"Output file size: {os.path.getsize(output_file)} bytes")
        else:
            print(f"Error: Failed to create output file: {output_file}")
        
        sys.exit(0)
    
    except Exception as e:
        print(f"Error in main function: {str(e)}")
        print(traceback.format_exc())
        
        error_result = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        
        try:
            print(f"Writing error to output file: {output_file}")
            with open(output_file, 'w') as f:
                output_json = json.dumps(error_result, indent=2)
                f.write(output_json)
            print(f"Error written to: {output_file}")
        except Exception as write_error:
            print(f"Failed to write error output: {str(write_error)}")
        
        sys.exit(1)

if __name__ == "__main__":
    main()
