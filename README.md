# Moduly
Generate sample module with [name] with just one command.

```bash
$ npm install -g moduly
$ moduly
```

## Feature
🦆 [Scaling your Redux App with ducks](https://medium.freecodecamp.org/scaling-your-redux-app-with-ducks-6115955638be)

Generate a list of files within a directory (duck, feature first) 

```bash
[modulename]
    ├── actions.js
    ├── index.js
    ├── normalize.js
    ├── reducer.js
    ├── sagas.js (saga option)
    ├── selectors.js
    ├── types.js
```

with redux-saga (sagas.js)
```js
import { call, take, put, fork } from 'redux-saga/effects'
  
import { bills } from './actions'
import { BILLS_REQUEST } from './types'
import normalize from './normalize'

const fetchApi = () => {
  return new Promise( resolve => {
    fetch( 'http://some-api-link/' ).then( res =>
      resolve( res.json() )
    )
  } )
}

function* fetchBills() {
  while ( yield take( BILLS_REQUEST ) ) {
    try {
      const response = yield call( fetchApi )
      const normalized = normalize( response )
      yield put( bills.success( normalized ) )
    } catch ( e ) {
      yield put( bills.failure( e ) )
    }
  }
}

export default [ fork( fetchBills ) ]
```

with redux-thunk (actions.js)
```js
const fetchBills = () => {
  return dispatch => {
    dispatch( bills.request() )
    return fetch( 'http://some-api-link/' )
      .then( res => ( res.ok ? res.json() : dispatch( bills.failure() ) ) )
      .then( res => normalize( res ) )
      .then( normalized => dispatch( bills.success( normalized ) ) )
  }
}
```

## Screenshot
![Screenshot](https://thumbs.gfycat.com/CorruptFlickeringGentoopenguin-size_restricted.gif)

### TODO
- [x] redux-saga
- [x] redux-thunk
- [ ] redux-api-middleware 
- [ ] reselect
- [ ] immutable
- [ ] normalize