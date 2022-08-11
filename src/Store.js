
import {configureStore} from '@reduxjs/toolkit'

import dat from './reducers/dataSlice'

const store = configureStore({
  reducer: {
    main: dat.dataSlice.reducer,
  }
})

export default store

