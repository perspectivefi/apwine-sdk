import Graph from 'graphology'

const pools = new Graph({ multi: true })

pools.addNode('PT', { index: 0 })
pools.addNode('Underlying', { index: 1 })
pools.addNode('FYT', { index: 1 })

// pool0
pools.addEdge('PT', 'Underlying', { pair: 0 })
pools.addEdge('Underlying', 'PT', { pair: 0 })

// pool1
pools.addEdge('PT', 'FYT', { pair: 1 })
pools.addEdge('FYT', 'PT', { pair: 1 })

export default pools
