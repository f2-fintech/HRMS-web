// store.ts (for TypeScript)

import { combineReducers, configureStore } from '@reduxjs/toolkit'

import teamsReducer from './features/teams/teamsSlice'
import holidaysReducer from './features/holidays/holidaysSlice'
import assestsReducer from './features/assests/assestsSlice'
import leavesReducer from './features/leaves/leavesSlice'
import attendancesReducer from './features/attendances/attendancesSlice'
import policiesReducer from './features/policies/policiesSlice'
import addAssetsReducer from './features/addAssets/addAssetsSlice'
import employeesReducer from './features/employees/employeesSlice'
import timesheetsReducer from './features/timesheet/timesheetSlice'
import designationReducer from '@/redux/features/designation/designationSlice'
import UpcomingBirthdaysReducer from '@/redux/features/employees/employeesSlice'

import fetchWorkAnniversaries from '@/redux/features/employees/employeesSlice'

import AwardSlice from '@/redux/features/performer/performereSlice'
import fineReducer from '@/redux/features/fines/fineSlice'
import breakSheetsReducer from '@/redux/features/breaksheets/breaksSlice'
import punchSheetReducer from '@/redux/features/punches/punchesSlice'
import queryReducer from '@/redux/features/queries/queriesSlice'
import sittingArrangmentReducer from '@/redux/features/sittingArrangment/seatingArrangementSlice'
import companiesReducer from '@/redux/features/company/companyslice'
import configurationReducer from './features/configuration/configurationSlice'

// const store = configureStore({
//   reducer: {
//     // Add your reducers here
//     teams: teamsReducer,
//     holidays: holidaysReducer,
//     assests: assestsReducer,
//     leaves: leavesReducer,
//     attendances: attendancesReducer,
//     policies: policiesReducer,
//     addAssets: addAssetsReducer,
//     employees: employeesReducer,
//     timesheets: timesheetsReducer,
//     designations: designationReducer,
//     upcomingBirthdays: UpcomingBirthdaysReducer,
//     awards: AwardSlice,
//     fines: fineReducer,
//     breaks: breakSheetsReducer,
//     punches: punchSheetReducer,
//     queries: queryReducer,
//     sittingArrangment: sittingArrangmentReducer,
//     companies: companiesReducer
//   }
// })

const appReducer = combineReducers({
  teams: teamsReducer,
  holidays: holidaysReducer,
  assests: assestsReducer,
  leaves: leavesReducer,
  attendances: attendancesReducer,
  policies: policiesReducer,
  addAssets: addAssetsReducer,
  employees: employeesReducer,
  timesheets: timesheetsReducer,
  designations: designationReducer,
  upcomingBirthdays: UpcomingBirthdaysReducer,
  awards: AwardSlice,
  fines: fineReducer,
  breaks: breakSheetsReducer,
  punches: punchSheetReducer,
  queries: queryReducer,
  sittingArrangment: sittingArrangmentReducer,
  companies: companiesReducer,
  configuration: configurationReducer,
})

// Root reducer with RESET functionality
const rootReducer = (state: any, action: any) => {
  if (action.type === 'RESET') {
    state = undefined // Reset the entire state
  }

  return appReducer(state, action)
}

export const store = configureStore({
  reducer: rootReducer
})

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
