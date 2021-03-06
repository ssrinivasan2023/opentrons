// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'

import { getRequestById } from '../../../robot-api'
import * as Sessions from '../../../sessions'
import { mockPipetteOffsetCalibrationSessionAttributes } from '../../../sessions/__fixtures__'

import { CalibratePipetteOffset } from '../index'
import {
  Introduction,
  DeckSetup,
  TipPickUp,
  TipConfirmation,
  SaveZPoint,
  SaveXYPoint,
  CompleteConfirmation,
} from '../../CalibrationPanels'

import type { State } from '../../../types'
import type { PipetteOffsetCalibrationStep } from '../../../sessions/types'

jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('../../../sessions/selectors')
jest.mock('../../../robot-api/selectors')

type CalibratePipetteOffsetSpec = {
  component: React.AbstractComponent<any>,
  childProps?: {},
  currentStep: PipetteOffsetCalibrationStep,
  ...
}

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

const mockGetRequestById: JestMockFn<
  [State, string],
  $Call<typeof getRequestById, State, string>
> = getRequestById

describe('CalibratePipetteOffset', () => {
  let mockStore
  let render
  let dispatch
  let mockPipOffsetCalSession: Sessions.PipetteOffsetCalibrationSession = {
    id: 'fake_session_id',
    ...mockPipetteOffsetCalibrationSessionAttributes,
  }

  const getExitButton = wrapper =>
    wrapper.find({ title: 'exit' }).find('button')

  const POSSIBLE_CHILDREN = [
    Introduction,
    DeckSetup,
    TipPickUp,
    TipConfirmation,
    SaveZPoint,
    SaveXYPoint,
    CompleteConfirmation,
  ]

  const SPECS: Array<CalibratePipetteOffsetSpec> = [
    { component: Introduction, currentStep: 'sessionStarted' },
    { component: DeckSetup, currentStep: 'labwareLoaded' },
    { component: TipPickUp, currentStep: 'preparingPipette' },
    { component: TipConfirmation, currentStep: 'inspectingTip' },
    { component: SaveZPoint, currentStep: 'joggingToDeck' },
    { component: SaveXYPoint, currentStep: 'savingPointOne' },
    { component: CompleteConfirmation, currentStep: 'calibrationComplete' },
  ]

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        robotApi: {},
      }),
      dispatch,
    }
    mockGetDeckDefinitions.mockReturnValue({})

    mockPipOffsetCalSession = {
      id: 'fake_session_id',
      ...mockPipetteOffsetCalibrationSessionAttributes,
    }

    render = () => {
      return mount(
        <CalibratePipetteOffset
          robotName="robot-name"
          session={mockPipOffsetCalSession}
          closeWizard={() => {}}
        />,
        {
          wrappingComponent: Provider,
          wrappingComponentProps: { store: mockStore },
        }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  SPECS.forEach(spec => {
    it(`renders correct contents when currentStep is ${spec.currentStep}`, () => {
      mockPipOffsetCalSession = {
        ...mockPipOffsetCalSession,
        details: {
          ...mockPipOffsetCalSession.details,
          currentStep: spec.currentStep,
        },
      }
      const wrapper = render()

      POSSIBLE_CHILDREN.forEach(child => {
        if (child === spec.component) {
          expect(wrapper.exists(child)).toBe(true)
        } else {
          expect(wrapper.exists(child)).toBe(false)
        }
      })
    })
  })

  it('renders confirm exit modal on exit click', () => {
    const wrapper = render()

    expect(wrapper.find('ConfirmExitModal').exists()).toBe(false)
    act(() => getExitButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(wrapper.find('ConfirmExitModal').exists()).toBe(true)
  })

  it('renders spinner when last tracked request is pending, and not present otherwise', () => {
    const wrapper = render()
    expect(wrapper.find('SpinnerModalPage').exists()).toBe(false)

    mockGetRequestById.mockReturnValue({ status: 'pending' })
    wrapper.setProps({})
    expect(wrapper.find('SpinnerModalPage').exists()).toBe(true)
  })
})
