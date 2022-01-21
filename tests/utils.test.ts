import { findSwapPath, howToSwap } from '../src/utils/swap'

describe('utils tests', () => {
  describe('swap utils', () => {
    it('For PT -> FYT it should return the correct path', () => {
      expect(findSwapPath('PT', 'FYT')).toEqual({ tokenPath: [0, 1], poolPath: [1] })
    })

    it('For FYT -> PT it should return the correct path', () => {
      expect(findSwapPath('FYT', 'PT')).toEqual({ tokenPath: [1, 0], poolPath: [1] })
    })

    it('For PT -> Underlying it should return the correct path', () => {
      expect(findSwapPath('PT', 'Underlying')).toEqual({ tokenPath: [0, 1], poolPath: [0] })
    })

    it('For Underlying -> PT it should return the correct path', () => {
      expect(findSwapPath('Underlying', 'PT')).toEqual({ tokenPath: [1, 0], poolPath: [0] })
    })

    it('For FYT -> Underlying it should return the correct path', () => {
      expect(findSwapPath('FYT', 'Underlying')).toEqual({ tokenPath: [1, 0, 0, 1], poolPath: [1, 0] })
    })

    it('For Underlying -> FYT it should return the correct path', () => {
      expect(findSwapPath('Underlying', 'FYT')).toEqual({ tokenPath: [1, 0, 0, 1], poolPath: [0, 1] })
    })
  })

  describe('howToSwap', () => {
    it('should be able to tell how to swap tokens', () => {
      const { tokenPath, namedTokenPath, poolPath, visual } = howToSwap('Underlying', 'FYT')

      expect(tokenPath).toEqual([1, 0, 0, 1])
      expect(namedTokenPath).toEqual(['Underlying', 'PT', 'PT', 'FYT'])
      expect(poolPath).toEqual([0, 1])
      expect(visual).toEqual('Underlying->PT->FYT')
    })
  })
})
