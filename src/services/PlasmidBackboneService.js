/**
 * PlasmidBackboneService.js
 * Provides access to common plasmid backbone sequences and metadata
 */

// Plasmid backbone categories and options
export const plasmidBackbones = {
  mammalian: [
    {
      id: 'pcDNA3.1',
      name: 'pcDNA3.1',
      description: 'High-level expression vector for mammalian cells with CMV promoter',
      size: 5428,
      features: ['CMV promoter', 'BGH poly(A) signal', 'Ampicillin resistance', 'Neomycin resistance'],
      source: 'Invitrogen/Thermo Fisher'
    },
    {
      id: 'pLVA',
      name: 'pLVA',
      description: 'Lentiviral vector for stable mammalian cell expression',
      size: 8911,
      features: ['LTR sequences', 'Packaging signal', 'Ampicillin resistance', 'Puromycin selection'],
      source: 'Common lentiviral backbone'
    },
    {
      id: 'pCAGGS',
      name: 'pCAGGS',
      description: 'Mammalian expression vector with CAG promoter for strong expression',
      size: 4738,
      features: ['CAG promoter', 'β-globin poly(A) signal', 'Ampicillin resistance'],
      source: 'Addgene'
    }
  ],
  bacterial: [
    {
      id: 'pET-28a',
      name: 'pET-28a',
      description: 'T7 promoter-driven expression vector with His-tag',
      size: 5369,
      features: ['T7 promoter', 'His-tag (N & C-terminal)', 'Kanamycin resistance', 'T7 terminator'],
      source: 'Novagen/Merck'
    },
    {
      id: 'pBAD',
      name: 'pBAD',
      description: 'Arabinose-inducible bacterial expression vector',
      size: 4102,
      features: ['araBAD promoter', 'Arabinose induction', 'Ampicillin resistance', 'rrnB terminator'],
      source: 'Invitrogen/Thermo Fisher'
    },
    {
      id: 'pGEX',
      name: 'pGEX',
      description: 'GST fusion protein expression system',
      size: 4969,
      features: ['tac promoter', 'GST tag', 'Thrombin cleavage site', 'Ampicillin resistance'],
      source: 'GE Healthcare/Cytiva'
    }
  ],
  cloning: [
    {
      id: 'pUC19',
      name: 'pUC19',
      description: 'High-copy number cloning vector',
      size: 2686,
      features: ['Multiple cloning site', 'lacZ α fragment', 'Ampicillin resistance', 'pMB1 origin'],
      source: 'New England Biolabs'
    },
    {
      id: 'pBR322',
      name: 'pBR322',
      description: 'Classic cloning vector with dual antibiotic resistance',
      size: 4361,
      features: ['Ampicillin resistance', 'Tetracycline resistance', 'pMB1 origin', 'Moderate copy number'],
      source: 'Thermo Fisher'
    }
  ]
};

/**
 * Fetches the sequence data for a given plasmid backbone ID
 * @param {string} plasmidId - The ID of the plasmid backbone
 * @returns {Promise<Object>} Sequence data ready for the editor
 */
export const getPlasmidSequence = async (plasmidId) => {
  // In a real application, this would fetch from a database or API
  // For demo purposes, we'll use placeholder data for some plasmids
  
  // Common features for demonstration
  const commonFeatures = [
    {
      id: "origin",
      name: "Origin of Replication",
      type: "misc_feature",
      start: 100,
      end: 700,
      forward: true,
      color: "#9933CC"
    },
    {
      id: "promoter",
      name: "Promoter",
      type: "promoter",
      start: 800,
      end: 900,
      forward: true,
      color: "#FF9900"
    },
    {
      id: "resistance",
      name: "Antibiotic Resistance",
      type: "CDS",
      start: 1000,
      end: 1900,
      forward: true,
      color: "#CC3333"
    },
    {
      id: "mcs",
      name: "Multiple Cloning Site",
      type: "misc_feature",
      start: 2000,
      end: 2100,
      forward: true,
      color: "#33CC33"
    }
  ];

  // Simplified placeholder sequence (in real app, would fetch actual sequences from NCBI)
  // Just using repeating pattern based on plasmid ID hash for demo
  const generatePlaceholderSequence = (id, length) => {
    const bases = ['A', 'C', 'G', 'T'];
    let seed = 0;
    // Simple hash of the ID
    for (let i = 0; i < id.length; i++) {
      seed += id.charCodeAt(i);
    }
    
    let sequence = '';
    for (let i = 0; i < length; i++) {
      const baseIndex = (seed + i) % 4;
      sequence += bases[baseIndex];
    }
    return sequence;
  };

  // Find the plasmid info
  let plasmidInfo = null;
  for (const category of Object.values(plasmidBackbones)) {
    const found = category.find(p => p.id === plasmidId);
    if (found) {
      plasmidInfo = found;
      break;
    }
  }

  if (!plasmidInfo) {
    throw new Error(`Plasmid backbone with ID "${plasmidId}" not found`);
  }

  // In a real app, this would fetch the real sequence
  const sequence = generatePlaceholderSequence(plasmidId, plasmidInfo.size);
  
  // Return the sequence data in the format expected by the editor
  return {
    sequenceData: {
      name: plasmidInfo.name,
      circular: true, // Most plasmids are circular
      sequence: sequence,
      features: commonFeatures.map(feature => ({
        ...feature,
        // Adjust feature positions based on sequence length to make them appear reasonable
        start: Math.floor((feature.start / 2100) * plasmidInfo.size),
        end: Math.floor((feature.end / 2100) * plasmidInfo.size)
      })),
      description: plasmidInfo.description,
      source: plasmidInfo.source
    }
  };
};

export default {
  plasmidBackbones,
  getPlasmidSequence
}; 