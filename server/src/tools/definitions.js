/**
 * Local-only tool definitions that Morpheus provides
 * directly, bypassing the MCP server.
 */
export const LOCAL_TOOL_DEFINITIONS = [
  {
    name: 'create_wallet',
    description: 'Generates a new Neo N3 wallet locally with a private key (WIF).',
    input_schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'A friendly name for the new wallet (e.g., My Neo Wallet).'
        }
      }
    }
  },
  {
    name: 'transfer_assets',
    description: 'Transfers NEO, GAS, or other tokens to another address. Requires private key access locally.',
    input_schema: {
      type: 'object',
      properties: {
        fromAddress: {
          type: 'string',
          description: 'The Neo N3 address to transfer from.'
        },
        toAddress: {
          type: 'string',
          description: 'The Neo N3 address to transfer tokens to.'
        },
        amount: {
          type: 'number',
          description: 'The amount of tokens to transfer.'
        },
        asset: {
          type: 'string',
          description: 'The asset symbol (e.g., NEO, GAS) or contract hash.'
        }
      },
      required: ['fromAddress', 'toAddress', 'amount', 'asset']
    }
  },
  {
    name: 'get_committee_info',
    description: 'Retrieves the list of current Neo committee members.',
    input_schema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: 'The network to query (mainnet or testnet).'
        }
      }
    }
  },
  {
    name: 'get_statistics',
    description: 'Retrieves general Neo N3 network statistics from Neo3Scan.',
    input_schema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: 'The network to query (mainnet or testnet).'
        }
      }
    }
  },
  {
    name: 'get_asset_infos',
    description: 'Retrieves a list of asset (symbol, supply, holders) on the Neo N3 network from Neo3Scan. Supports filtering by Standard (NEP17 or NEP11).',
    input_schema: {
      type: 'object',
      properties: {
        standard: { type: 'string', enum: ['NEP17', 'NEP11'], description: 'The token standard (NEP17 or NEP11).' },
        limit: { type: 'number', description: 'Maximum number of assets to return.' },
        skip: { type: 'number', description: 'Number of assets to skip (for pagination).' },
        network: { type: 'string', description: 'The network to query (mainnet or testnet).' }
      },
      required: ['standard']
    }
  },
  {
    name: 'get_asset_prices',
    description: 'Retrieves current USD prices for NEO and GAS tokens from CoinGecko.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },

  // --- INDIVIDUAL RPC TOOLS ---

  // Blockchain
  {
    name: 'rpc_getbestblockhash',
    description: 'Gets the hash of the tallest block in the main chain.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_getblock',
    description: 'Returns the block information with the specified hash value or index.',
    input_schema: {
      type: 'object',
      properties: {
        hash_or_index: { type: ['string', 'number'], description: 'Block hash or index.' },
        verbose: { type: 'number', description: '0 for hex, 1 for JSON. Default is 0.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['hash_or_index']
    }
  },
  {
    name: 'rpc_getblockcount',
    description: 'Returns the total number of blocks in the blockchain.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_getblockhash',
    description: 'Returns the block hash with the specified block height index.',
    input_schema: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Block height index.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['index']
    }
  },
  {
    name: 'rpc_getblockheader',
    description: 'Returns the header information of a block by hash or index.',
    input_schema: {
      type: 'object',
      properties: {
        hash_or_index: { type: ['string', 'number'], description: 'Block hash or index.' },
        verbose: { type: 'number', description: '0 or 1.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['hash_or_index']
    }
  },
  {
    name: 'rpc_getcommittee',
    description: 'Gets the public key list of current Neo committee members.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_getnativecontracts',
    description: 'Gets the list of native contracts.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_getnextblockvalidators',
    description: 'Gets the validators list of the next block.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_getcontractstate',
    description: 'Returns information of the contract with the specified script hash.',
    input_schema: {
      type: 'object',
      properties: {
        script_hash: { type: 'string', description: 'Contract script hash.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['script_hash']
    }
  },
  {
    name: 'rpc_getrawmempool',
    description: 'Gets a list of transaction hashes in memory. If 1, gets verified and unverified.',
    input_schema: {
      type: 'object',
      properties: {
        shouldGetUnverified: { type: 'number', description: '0 or 1. Default 0.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_getrawtransaction',
    description: 'Returns the transaction information with the specified hash value.',
    input_schema: {
      type: 'object',
      properties: {
        txid: { type: 'string', description: 'Transaction ID hash.' },
        verbose: { type: 'number', description: '0 or 1.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['txid']
    }
  },
  {
    name: 'rpc_getstorage',
    description: "Returns the value stored in a contract's storage for a given key.",
    input_schema: {
      type: 'object',
      properties: {
        script_hash: { type: 'string', description: 'Contract script hash.' },
        key: { type: 'string', description: 'Storage key in hex.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['script_hash', 'key']
    }
  },
  {
    name: 'rpc_gettransactionheight',
    description: 'Returns the block height where a transaction was included.',
    input_schema: {
      type: 'object',
      properties: {
        txid: { type: 'string', description: 'Transaction ID hash.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['txid']
    }
  },
  {
    name: 'rpc_findStorage',
    description: 'Finds storage items by contract ID or script hash and prefix.',
    input_schema: {
      type: 'object',
      properties: {
        script_hash: { type: ['string', 'number'], description: 'Contract script hash or ID.' },
        prefix: { type: 'string', description: 'Storage key prefix in hex.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['script_hash', 'prefix']
    }
  },

  // Node
  {
    name: 'rpc_getconnectioncount',
    description: 'Gets the current connection count of the node.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_getpeers',
    description: 'Returns lists of connected, discovered, or disconnected nodes.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_getversion',
    description: 'Returns the version and settings of the node.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_sendrawtransaction',
    description: 'Broadcasts a signed transaction (hex) to the network.',
    input_schema: {
      type: 'object',
      properties: {
        hex: { type: 'string', description: 'Signed transaction hex.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['hex']
    }
  },
  {
    name: 'rpc_submitblock',
    description: 'Submits a new block to the network (requires validator privileges).',
    input_schema: {
      type: 'object',
      properties: {
        hex: { type: 'string', description: 'Block hex.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['hex']
    }
  },

  // Smart Contract
  {
    name: 'rpc_getunclaimedgas',
    description: 'Get unclaimed gas of the specified address.',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Neo N3 address.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['address']
    }
  },
  {
    name: 'rpc_invokefunction',
    description: 'Invokes a smart contract function (read-only simulation).',
    input_schema: {
      type: 'object',
      properties: {
        script_hash: { type: 'string' },
        operation: { type: 'string', description: 'Method name.' },
        params: { type: 'array', description: 'Method parameters.' },
        sender: { type: 'string', description: 'Optional sender address.' },
        signers: { type: 'array', description: 'Optional signers.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['script_hash', 'operation']
    }
  },
  {
    name: 'rpc_invokescript',
    description: 'Runs a custom VM script (base64) and returns the results.',
    input_schema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'Base64 encoded script.' },
        sender: { type: 'string', description: 'Optional sender address.' },
        signers: { type: 'array', description: 'Optional signers.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['script']
    }
  },
  {
    name: 'rpc_traverseiterator',
    description: 'Gets data from a session-based Iterator.',
    input_schema: {
      type: 'object',
      properties: {
        session: { type: 'string', description: 'Session ID.' },
        iterator_id: { type: 'string', description: 'Iterator ID.' },
        count: { type: 'number', description: 'Number of items to retrieve.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['session', 'iterator_id', 'count']
    }
  },

  // Tool
  {
    name: 'rpc_listplugins',
    description: 'Returns a list of plugins loaded by the node.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_validateaddress',
    description: 'Verifies whether a string is a valid Neo N3 address.',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['address']
    }
  },

  // Wallet
  {
    name: 'rpc_calculatenetworkfee',
    description: 'Calculates the network fee for a given transaction.',
    input_schema: {
      type: 'object',
      properties: {
        tx: { type: 'string', description: 'Transaction hex.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['tx']
    }
  },

  // ApplicationLogs plugin
  {
    name: 'rpc_getapplicationlog',
    description: 'Returns the contract event information based on the specified txid.',
    input_schema: {
      type: 'object',
      properties: {
        txid: { type: 'string', description: 'Transaction hash.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['txid']
    }
  },

  // TokensTracker plugin
  {
    name: 'rpc_getnep11balances',
    description: 'Returns the balance of all NEP11 assets (NFTs) for a specified address.',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['address']
    }
  },
  {
    name: 'rpc_getnep11properties',
    description: 'Returns the properties of a specific NEP-11 NFT.',
    input_schema: {
      type: 'object',
      properties: {
        contract_hash: { type: 'string' },
        tokenId: { type: 'string', description: 'Token ID in hex.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['contract_hash', 'tokenId']
    }
  },
  {
    name: 'rpc_getnep11transfers',
    description: 'Returns NEP11 transfer logs for a specified address.',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        timestamp: { type: 'number', description: 'Optional start timestamp.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['address']
    }
  },
  {
    name: 'rpc_getnep17balances',
    description: 'Returns the balance of all NEP17 tokens for a specified address.',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['address']
    }
  },
  {
    name: 'rpc_getnep17transfers',
    description: 'Returns NEP17 transfer logs for a specified address.',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        timestamp: { type: 'number', description: 'Optional start timestamp.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['address']
    }
  },

  // StateService plugin
  {
    name: 'rpc_getstateroot',
    description: 'Queries the state root by block height.',
    input_schema: {
      type: 'object',
      properties: {
        index: { type: 'number' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['index']
    }
  },
  {
    name: 'rpc_getproof',
    description: 'Gets proof by querying root hash, contract hash, and storage key.',
    input_schema: {
      type: 'object',
      properties: {
        roothash: { type: 'string' },
        scripthash: { type: 'string' },
        key: { type: 'string', description: 'Base64 encoded key.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['roothash', 'scripthash', 'key']
    }
  },
  {
    name: 'rpc_verifyproof',
    description: 'Verifies a state proof against a root hash.',
    input_schema: {
      type: 'object',
      properties: {
        roothash: { type: 'string' },
        proof: { type: 'string', description: 'Base64 encoded proof.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['roothash', 'proof']
    }
  },
  {
    name: 'rpc_getstateheight',
    description: 'Queries the current state root height.',
    input_schema: {
      type: 'object',
      properties: {
        network: { type: 'string', description: 'mainnet or testnet.' }
      }
    }
  },
  {
    name: 'rpc_getstate',
    description: 'Queries a specific state value with root hash, contract hash and key.',
    input_schema: {
      type: 'object',
      properties: {
        roothash: { type: 'string' },
        scripthash: { type: 'string' },
        key: { type: 'string', description: 'Base64 encoded key.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['roothash', 'scripthash', 'key']
    }
  },
  {
    name: 'rpc_findstates',
    description: 'Finds states with a specific prefix under a root hash.',
    input_schema: {
      type: 'object',
      properties: {
        roothash: { type: 'string' },
        scripthash: { type: 'string' },
        prefix: { type: 'string', description: 'Base64 encoded prefix.' },
        key: { type: 'string', description: 'Optional base64 start key.' },
        count: { type: 'number', description: 'Items to retrieve.' },
        network: { type: 'string', description: 'mainnet or testnet.' }
      },
      required: ['roothash', 'scripthash', 'prefix']
    }
  }
];
