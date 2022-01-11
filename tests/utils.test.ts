import { findSwapPath } from '../src/utils/swap'

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
})
