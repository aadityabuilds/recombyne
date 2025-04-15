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
            source: 'Invitrogen/Thermo Fisher',
            addgene_id: null
        },
        {
            id: 'pCMV-Cas9',
            name: 'pCMV-Cas9',
            description: 'Cas9 expression vector for mammalian CRISPR applications',
            size: 9174,
            features: ['CMV promoter', 'Cas9 gene', 'Nuclear localization signal', 'Ampicillin resistance'],
            source: 'Addgene',
            addgene_id: 2565
        },
        {
            id: 'pLVA',
            name: 'pLVA',
            description: 'Lentiviral vector for stable mammalian cell expression',
            size: 8911,
            features: ['LTR sequences', 'Packaging signal', 'Ampicillin resistance', 'Puromycin selection'],
            source: 'Common lentiviral backbone',
            addgene_id: null
        },
        {
            id: 'pCAGGS',
            name: 'pCAGGS',
            description: 'Mammalian expression vector with CAG promoter for strong expression',
            size: 4738,
            features: ['CAG promoter', 'β-globin poly(A) signal', 'Ampicillin resistance'],
            source: 'Addgene',
            addgene_id: 89758
        },
        {
            id: 'pAAV',
            name: 'pAAV-CMV',
            description: 'Adeno-associated viral vector for gene therapy applications',
            size: 6200,
            features: ['CMV promoter', 'ITR sequences', 'Ampicillin resistance', 'SV40 poly(A)'],
            source: 'Addgene',
            addgene_id: 104055
        }
    ],
    bacterial: [
        {
            id: 'pET-28a',
            name: 'pET-28a',
            description: 'T7 promoter-driven expression vector with His-tag',
            size: 5369,
            features: ['T7 promoter', 'His-tag (N & C-terminal)', 'Kanamycin resistance', 'T7 terminator'],
            source: 'Novagen/Merck',
            addgene_id: null
        },
        {
            id: 'pBAD',
            name: 'pBAD',
            description: 'Arabinose-inducible bacterial expression vector',
            size: 4102,
            features: ['araBAD promoter', 'Arabinose induction', 'Ampicillin resistance', 'rrnB terminator'],
            source: 'Invitrogen/Thermo Fisher',
            addgene_id: null
        },
        {
            id: 'pGEX',
            name: 'pGEX',
            description: 'GST fusion protein expression system',
            size: 4969,
            features: ['tac promoter', 'GST tag', 'Thrombin cleavage site', 'Ampicillin resistance'],
            source: 'GE Healthcare/Cytiva',
            addgene_id: null
        },
        {
            id: 'pTrc99A',
            name: 'pTrc99A',
            description: 'IPTG-inducible bacterial expression vector',
            size: 4176,
            features: ['trc promoter', 'IPTG induction', 'Ampicillin resistance', 'lacIq repressor'],
            source: 'Genscript/Addgene',
            addgene_id: 15247
        }
    ],
    cloning: [
        {
            id: 'pUC19',
            name: 'pUC19',
            description: 'High-copy number cloning vector',
            size: 2686,
            features: ['Multiple cloning site', 'lacZ α fragment', 'Ampicillin resistance', 'pMB1 origin'],
            source: 'New England Biolabs',
            addgene_id: 50005
        },
        {
            id: 'pBR322',
            name: 'pBR322',
            description: 'Classic cloning vector with dual antibiotic resistance',
            size: 4361,
            features: ['Ampicillin resistance', 'Tetracycline resistance', 'pMB1 origin', 'Moderate copy number'],
            source: 'Thermo Fisher',
            addgene_id: null
        },
        {
            id: 'pBluescript',
            name: 'pBluescript II KS+',
            description: 'General purpose cloning vector with blue-white screening',
            size: 2961,
            features: ['T3/T7 promoters', 'Multiple cloning site', 'Ampicillin resistance', 'lacZ α fragment'],
            source: 'Agilent/Addgene',
            addgene_id: 212207
        },
        {
            id: 'pcDNA-DEST53',
            name: 'pcDNA-DEST53',
            description: 'Gateway destination vector for protein expression in mammalian cells with GFP tag',
            size: 7889,
            features: ['CMV promoter', 'GFP tag', 'Ampicillin resistance', 'Gateway recombination sites'],
            source: 'Thermo Fisher',
            addgene_id: null
        }
    ],
    synthetic: [
        {
            id: 'pSB1C3',
            name: 'pSB1C3',
            description: 'Standard synthetic biology cloning vector (BioBrick)',
            size: 2070,
            features: ['BioBrick prefix/suffix', 'Chloramphenicol resistance', 'High copy number', 'RFC10 compatibility'],
            source: 'iGEM',
            addgene_id: 1000000
        },
        {
            id: 'pET-28b-GFP',
            name: 'pET-28b-GFP',
            description: 'Bacterial expression vector with GFP tag',
            size: 6089,
            features: ['T7 promoter', 'GFP tag', 'Kanamycin resistance', 'His-tag'],
            source: 'Addgene',
            addgene_id: 54759
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
    // Real sequence for pET-28a and placeholders for others
    const plasmidSequences = {
        'pET-28a': 'ATCCGGATATAGTTCCTCCTTTCAGCAAAAAACCCCTCAAGACCCGTTTAGAGGCCCCAAGGGGTTATGCTAGTTATTGCTCAGCGGTGGCAGCAGCCAACTCAGCTTCCTTTCGGGCTTTGTTAGCAGCCGGATCTCAGTGGTGGTGGTGGTGGTGCTCGAGTGCGGCCGCAAGCTTGTCGACGGAGCTCGAATTCGGATCCGCGACCCATTTGCTGTCCACCAGTCATGCTAGCCATATGGCTGCCGCGCGGCACCAGGCCGCTGCTGTGATGATGATGATGATGGCTGCTGCCCATGGTATATCTCCTTCTTAAAGTTAAACAAAATTATTTCTAGAGGGGAATTGTTATCCGCTCACAATTCCCCTATAGTGAGTCGTATTAATTTCGCGGGATCGAGATCTCGATCCTCTACGCCGGACGCATCGTGGCCGGCATCACCGGCGCCACAGGTGCGGTTGCTGGCGCCTATATCGCCGACATCACCGATGGGGAAGATCGGGCTCGCCACTTCGGGCTCATGAGCGCTTGTTTCGGCGTGGGTATGGTGGCAGGCCCCGTGGCCGGGGGACTGTTGGGCGCCATCTCCTTGCATGCACCATTCCTTGCGGCGGCGGTGCTCAACGGCCTCAACCTACTACTGGGCTGCTTCCTAATGCAGGAGTCGCATAAGGGAGAGCGTCGAGATCCCGGACACCATCGAATGGCGCAAAACCTTTCGCGGTATGGCATGATAGCGCCCGGAAGAGAGTCAATTCAGGGTGGTGAATGTGAAACCAGTAACGTTATACGATGTCGCAGAGTATGCCGGTGTCTCTTATCAGACCGTTTCCCGCGTGGTGAACCAGGCCAGCCACGTTTCTGCGAAAACGCGGGAAAAAGTGGAAGCGGCGATGGCGGAGCTGAATTACATTCCCAACCGCGTGGCACAACAACTGGCGGGCAAACAGTCGTTGCTGATTGGCGTTGCCACCTCCAGTCTGGCCCTGCACGCGCCGTCGCAAATTGTCGCGGCGATTAAATCTCGCGCCGATCAACTGGGTGCCAGCGTGGTGGTGTCGATGGTAGAACGAAGCGGCGTCGAAGCCTGTAAAGCGGCGGTGCACAATCTTCTCGCGCAACGCGTCAGTGGGCTGATCATTAACTATCCGCTGGATGACCAGGATGCCATTGCTGTGGAAGCTGCCTGCACTAATGTTCCGGCGTTATTTCTTGATGTCTCTGACCAGACACCCATCAACAGTATTATTTTCTCCCATGAAGACGGTACGCGACTGGGCGTGGAGCATCTGGTCGCATTGGGTCACCAGCAAATCGCGCTGTTAGCGGGCCCATTAAGTTCTGTCTCGGCGCGTCTGCGTCTGGCTGGCTGGCATAAATATCTCACTCGCAATCAAATTCAGCCGATAGCGGAACGGGAAGGCGACTGGAGTGCCATGTCCGGTTTTCAACAAACCATGCAAATGCTGAATGAGGGCATCGTTCCCACTGCGATGCTGGTTGCCAACGATCAGATGGCGCTGGGCGCAATGCGCGCCATTACCGAGTCCGGGCTGCGCGTTGGTGCGGATATCTCGGTAGTGGGATACGACGATACCGAAGACAGCTCATGTTATATCCCGCCGTTAACCACCATCAAACAGGATTTTCGCCTGCTGGGGCAAACCAGCGTGGACCGCTTGCTGCAACTCTCTCAGGGCCAGGCGGTGAAGGGCAATCAGCTGTTGCCCGTCTCACTGGTGAAAAGAAAAACCACCCTGGCGCCCAATACGCAAACCGCCTCTCCCCGCGCGTTGGCCGATTCATTAATGCAGCTGGCACGACAGGTTTCCCGACTGGAAAGCGGGCAGTGAGCGCAACGCAATTAATGTAAGTTAGCTCACTCATTAGGCACCGGGATCTCGACCGATGCCCTTGAGAGCCTTCAACCCAGTCAGCTCCTTCCGGTGGGCGCGGGGCATGACTATCGTCGCCGCACTTATGACTGTCTTCTTTATCATGCAACTCGTAGGACAGGTGCCGGCAGCGCTCTGGGTCATTTTCGGCGAGGACCGCTTTCGCTGGAGCGCGACGATGATCGGCCTGTCGCTTGCGGTATTCGGAATCTTGCACGCCCTCGCTCAAGCCTTCGTCACTGGTCCCGCCACCAAACGTTTCGGCGAGAAGCAGGCCATTATCGCCGGCATGGCGGCCCCACGGGTGCGCATGATCGTGCTCCTGTCGTTGAGGACCCGGCTAGGCTGGCGGGGTTGCCTTACTGGTTAGCAGAATGAATCACCGATACGCGAGCGAACGTGAAGCGACTGCTGCTGCAAAACGTCTGCGACCTGAGCAACAACATGAATGGTCTTCGGTTTCCGTGTTTCGTAAAGTCTGGAAACGCGGAAGTCAGCGCCCTGCACCATTATGTTCCGGATCTGCATCGCAGGATGCTGCTGGCTACCCTGTGGAACACCTACATCTGTATTAACGAAGCGCTGGCATTGACCCTGAGTGATTTTTCTCTGGTCCCGCCGCATCCATACCGCCAGTTGTTTACCCTCACAACGTTCCAGTAACCGGGCATGTTCATCATCAGTAACCCGTATCGTGAGCATCCTCTCTCGTTTCATCGGTATCATTACCCCCATGAACAGAAATCCCCCTTACACGGAGGCATCAGTGACCAAACAGGAAAAAACCGCCCTTAACATGGCCCGCTTTATCAGAAGCCAGACATTAACGCTTCTGGAGAAACTCAACGAGCTGGACGCGGATGAACAGGCAGACATCTGTGAATCGCTTCACGACCACGCTGATGAGCTTTACCGCAGCTGCCTCGCGCGTTTCGGTGATGACGGTGAAAACCTCTGACACATGCAGCTCCCGGAGACGGTCACAGCTTGTCTGTAAGCGGATGCCGGGAGCAGACAAGCCCGTCAGGGCGCGTCAGCGGGTGTTGGCGGGTGTCGGGGCGCAGCCATGACCCAGTCACGTAGCGATAGCGGAGTGTATACTGGCTTAACTATGCGGCATCAGAGCAGATTGTACTGAGAGTGCACCATATATGCGGTGTGAAATACCGCACAGATGCGTAAGGAGAAAATACCGCATCAGGCGCTCTTCCGCTTCCTCGCTCACTGACTCGCTGCGCTCGGTCGTTCGGCTGCGGCGAGCGGTATCAGCTCACTCAAAGGCGGTAATACGGTTATCCACAGAATCAGGGGATAACGCAGGAAAGAACATGTGAGCAAAAGGCCAGCAAAAGGCCAGGAACCGTAAAAAGGCCGCGTTGCTGGCGTTTTTCCATAGGCTCCGCCCCCCTGACGAGCATCACAAAAATCGACGCTCAAGTCAGAGGTGGCGAAACCCGACAGGACTATAAAGATACCAGGCGTTTCCCCCTGGAAGCTCCCTCGTGCGCTCTCCTGTTCCGACCCTGCCGCTTACCGGATACCTGTCCGCCTTTCTCCCTTCGGGAAGCGTGGCGCTTTCTCATAGCTCACGCTGTAGGTATCTCAGTTCGGTGTAGGTCGTTCGCTCCAAGCTGGGCTGTGTGCACGAACCCCCCGTTCAGCCCGACCGCTGCGCCTTATCCGGTAACTATCGTCTTGAGTCCAACCCGGTAAGACACGACTTATCGCCACTGGCAGCAGCCACTGGTAACAGGATTAGCAGAGCGAGGTATGTAGGCGGTGCTACAGAGTTCTTGAAGTGGTGGCCTAACTACGGCTACACTAGAAGGACAGTATTTGGTATCTGCGCTCTGCTGAAGCCAGTTACCTTCGGAAAAAGAGTTGGTAGCTCTTGATCCGGCAAACAAACCACCGCTGGTAGCGGTGGTTTTTTTGTTTGCAAGCAGCAGATTACGCGCAGAAAAAAAGGATCTCAAGAAGATCCTTTGATCTTTTCTACGGGGTCTGACGCTCAGTGGAACGAAAACTCACGTTAAGGGATTTTGGTCATGAACAATAAAACTGTCTGCTTACATAAACAGTAATACAAGGGGTGTTATGAGCCATATTCAACGGGAAACGTCTTGCTCTAGGCCGCGATTAAATTCCAACATGGATGCTGATTTATATGGGTATAAATGGGCTCGCGATAATGTCGGGCAATCAGGTGCGACAATCTATCGATTGTATGGGAAGCCCGATGCGCCAGAGTTGTTTCTGAAACATGGCAAAGGTAGCGTTGCCAATGATGTTACAGATGAGATGGTCAGACTAAACTGGCTGACGGAATTTATGCCTCTTCCGACCATCAAGCATTTTATCCGTACTCCTGATGATGCATGGTTACTCACCACTGCGATCCCCGGGAAAACAGCATTCCAGGTATTAGAAGAATATCCTGATTCAGGTGAAAATATTGTTGATGCGCTGGCAGTGTTCCTGCGCCGGTTGCATTCGATTCCTGTTTGTAATTGTCCTTTTAACAGCGATCGCGTATTTCGTCTCGCTCAGGCGCAATCACGAATGAATAACGGTTTGGTTGATGCGAGTGATTTTGATGACGAGCGTAATGGCTGGCCTGTTGAACAAGTCTGGAAAGAAATGCATAAACTTTTGCCATTCTCACCGGATTCAGTCGTCACTCATGGTGATTTCTCACTTGATAACCTTATTTTTGACGAGGGGAAATTAATAGGTTGTATTGATGTTGGACGAGTCGGAATCGCAGACCGATACCAGGATCTTGCCATCCTATGGAACTGCCTCGGTGAGTTTTCTCCTTCATTACAGAAACGGCTTTTTCAAAAATATGGTATTGATAATCCTGATATGAATAAATTGCAGTTTCATTTGATGCTCGATGAGTTTTTCTAAGAATTAATTCATGAGCGGATACATATTTGAATGTATTTAGAAAAATAAACAAATAGGGGTTCCGCGCACATTTCCCCGAAAAGTGCCACCTGAAATTGTAAACGTTAATATTTTGTTAAAATTCGCGTTAAATTTTTGTTAAATCAGCTCATTTTTTAACCAATAGGCCGAAATCGGCAAAATCCCTTATAAATCAAAAGAATAGACCGAGATAGGGTTGAGTGTTGTTCCAGTTTGGAACAAGAGTCCACTATTAAAGAACGTGGACTCCAACGTCAAAGGGCGAAAAACCGTCTATCAGGGCGATGGCCCACTACGTGAACCATCACCCTAATCAAGTTTTTTGGGGTCGAGGTGCCGTAAAGCACTAAATCGGAACCCTAAAGGGAGCCCCCGATTTAGAGCTTGACGGGGAAAGCCGGCGAACGTGGCGAGAAAGGAAGGGAAGAAAGCGAAAGGAGCGGGCGCTAGGGCGCTGGCAAGTGTAGCGGTCACGCTGCGCGTAACCACCACACCCGCCGCGCTTAATGCGCCGCTACAGGGCGCGTCCCATTCGCCA'
    };
    // Simplified placeholder sequence generator for other plasmids
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
    // Use real sequence if available, otherwise generate placeholder
    const sequence = plasmidSequences[plasmidId] || generatePlaceholderSequence(plasmidId, plasmidInfo.size);
    // Define accurate features for pET-28a
    const pET28aFeatures = [
        {
            id: "f1_origin",
            name: "f1 origin",
            type: "rep_origin",
            start: 2533,
            end: 2988,
            forward: true,
            color: "#9933CC",
            notes: {
                function: "Origin of replication derived from bacteriophage f1"
            }
        },
        {
            id: "kan_resistance",
            name: "Kanamycin resistance gene",
            type: "CDS",
            start: 3995,
            end: 4807,
            forward: true,
            color: "#CC3333",
            notes: {
                gene: "kan",
                product: "aminoglycoside phosphotransferase",
                function: "Confers resistance to kanamycin"
            }
        },
        {
            id: "ori",
            name: "pBR322 origin",
            type: "rep_origin",
            start: 3348,
            end: 3967,
            forward: true,
            color: "#9933CC",
            notes: {
                function: "Origin of replication from pBR322 plasmid"
            }
        },
        {
            id: "lacI",
            name: "lacI",
            type: "CDS",
            start: 773,
            end: 1852,
            forward: true,
            color: "#3366FF",
            notes: {
                gene: "lacI",
                product: "lac repressor",
                function: "Represses transcription from T7 promoter in the absence of IPTG"
            }
        },
        {
            id: "t7_promoter",
            name: "T7 promoter",
            type: "promoter",
            start: 614,
            end: 632,
            forward: true,
            color: "#FF9900",
            notes: {
                function: "Promoter recognized by T7 RNA polymerase for high-level expression"
            }
        },
        {
            id: "his_tag",
            name: "His-tag",
            type: "misc_feature",
            start: 150,
            end: 167,
            forward: true,
            color: "#33CC33",
            notes: {
                function: "6x Histidine tag for protein purification"
            }
        },
        {
            id: "mcs",
            name: "Multiple Cloning Site",
            type: "misc_feature",
            start: 158,
            end: 203,
            forward: true,
            color: "#33CC33",
            notes: {
                function: "Region containing multiple restriction enzyme sites for cloning"
            }
        },
        {
            id: "t7_terminator",
            name: "T7 terminator",
            type: "terminator",
            start: 26,
            end: 73,
            forward: true,
            color: "#AAAA00",
            notes: {
                function: "Transcription terminator from bacteriophage T7"
            }
        }
    ];
    // Return the sequence data in the format expected by the editor
    return {
        sequenceData: {
            name: plasmidInfo.name,
            circular: true, // Most plasmids are circular
            sequence: sequence,
            features: plasmidId === 'pET-28a' ? pET28aFeatures : commonFeatures.map(feature => ({
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
