// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import type { Mount } from '@opentrons/components'

import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'
import { SaveXYPoint } from '../SaveXYPoint'

const currentStepBySlot = {
  '1': Sessions.DECK_STEP_SAVING_POINT_ONE,
  '3': Sessions.DECK_STEP_SAVING_POINT_TWO,
  '7': Sessions.DECK_STEP_SAVING_POINT_THREE,
}
describe('SaveXYPoint', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getJogButton = (wrapper, direction) =>
    wrapper.find(`JogButton[name="${direction}"]`).find('button')

  const getVideo = wrapper => wrapper.find(`source`)

  beforeEach(() => {
    render = (props = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_SAVING_POINT_ONE,
      } = props
      return mount(
        <SaveXYPoint
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          sendSessionCommand={sendSessionCommand}
          deleteSession={deleteSession}
          currentStep={currentStep}
        />
      )
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('displays proper asset', () => {
    const slot1LeftMultiSrc = 'SLOT_1_LEFT_MULTI_X-Y.webm'
    const slot1LeftSingleSrc = 'SLOT_1_LEFT_SINGLE_X-Y.webm'
    const slot1RightMultiSrc = 'SLOT_1_RIGHT_MULTI_X-Y.webm'
    const slot1RightSingleSrc = 'SLOT_1_RIGHT_SINGLE_X-Y.webm'
    const slot3LeftMultiSrc = 'SLOT_3_LEFT_MULTI_X-Y.webm'
    const slot3LeftSingleSrc = 'SLOT_3_LEFT_SINGLE_X-Y.webm'
    const slot3RightMultiSrc = 'SLOT_3_RIGHT_MULTI_X-Y.webm'
    const slot3RightSingleSrc = 'SLOT_3_RIGHT_SINGLE_X-Y.webm'
    const slot7LeftMultiSrc = 'SLOT_7_LEFT_MULTI_X-Y.webm'
    const slot7LeftSingleSrc = 'SLOT_7_LEFT_SINGLE_X-Y.webm'
    const slot7RightMultiSrc = 'SLOT_7_RIGHT_MULTI_X-Y.webm'
    const slot7RightSingleSrc = 'SLOT_7_RIGHT_SINGLE_X-Y.webm'
    const assetMap: { [string]: { [Mount]: { ... }, ... }, ... } = {
      '1': {
        left: {
          multi: slot1LeftMultiSrc,
          single: slot1LeftSingleSrc,
        },
        right: {
          multi: slot1RightMultiSrc,
          single: slot1RightSingleSrc,
        },
      },
      '3': {
        left: {
          multi: slot3LeftMultiSrc,
          single: slot3LeftSingleSrc,
        },
        right: {
          multi: slot3RightMultiSrc,
          single: slot3RightSingleSrc,
        },
      },
      '7': {
        left: {
          multi: slot7LeftMultiSrc,
          single: slot7LeftSingleSrc,
        },
        right: {
          multi: slot7RightMultiSrc,
          single: slot7RightSingleSrc,
        },
      },
    }
    Object.keys(assetMap).forEach(slotNumber => {
      const xyStep = assetMap[slotNumber]
      Object.keys(xyStep).forEach(mountString => {
        Object.keys(xyStep[mountString]).forEach(channelString => {
          const wrapper = render({
            pipMount: mountString,
            isMulti: channelString === 'multi',
            currentStep: currentStepBySlot[slotNumber],
          })
          expect(getVideo(wrapper).prop('src')).toEqual(
            xyStep[mountString][channelString]
          )
        })
      })
    })
  })

  it('allows jogging in z axis', () => {
    const wrapper = render()

    const jogDirections = ['left', 'right', 'back', 'forward']
    const jogVectorByDirection = {
      left: [-0.1, 0, 0],
      right: [0.1, 0, 0],
      back: [0, 0.1, 0],
      forward: [0, -0.1, 0],
    }
    jogDirections.forEach(direction => {
      act(() => getJogButton(wrapper, direction).invoke('onClick')())
      wrapper.update()

      expect(mockSendCommand).toHaveBeenCalledWith(
        Sessions.deckCalCommands.JOG,
        {
          vector: jogVectorByDirection[direction],
        },
        false
      )
    })

    const unavailableJogDirections = ['up', 'down']
    unavailableJogDirections.forEach(direction => {
      expect(getJogButton(wrapper, direction)).toEqual({})
    })
  })

  it('sends save offset and move to point two commands when current step is savingPointOne', () => {
    const wrapper = render()

    act(() =>
      wrapper
        .find('PrimaryButton[children="save calibration and move to slot 3"]')
        .invoke('onClick')()
    )
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.SAVE_OFFSET
    )
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.MOVE_TO_POINT_TWO
    )
  })

  it('sends save offset and move to point three commands when current step is savingPointTwo', () => {
    const wrapper = render({ currentStep: Sessions.DECK_STEP_SAVING_POINT_TWO })

    act(() =>
      wrapper
        .find('PrimaryButton[children="save calibration and move to slot 7"]')
        .invoke('onClick')()
    )
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.SAVE_OFFSET
    )
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.MOVE_TO_POINT_THREE
    )
  })

  it('sends save offset and move to tip rack commands when current step is savingPointThree', () => {
    const wrapper = render({
      currentStep: Sessions.DECK_STEP_SAVING_POINT_THREE,
    })

    act(() =>
      wrapper
        .find('PrimaryButton[children="save calibration"]')
        .invoke('onClick')()
    )
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.SAVE_OFFSET
    )
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.MOVE_TO_TIP_RACK
    )
  })
})
