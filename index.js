const mkdirp = require('mkdirp')
const fs = require('fs-promise')
const Listr = require('listr')
const inquirer = require('inquirer')
const chalk = require('chalk')

const capitalize = str => {
  return str[0].toUpperCase() + str.substring(1)
}

const createComponent = ctx => {
  const {
    moduleNmae: module,
    moduleStyleUpper,
    moduleStyleCapitalize,
    moduleType
  } = ctx

  const containersDir = `${moduleStyleCapitalize}/containers`
  mkdirp(containersDir, err => {
    const indexDir = `${containersDir}/index.js`
    fs.writeFile(indexDir, '', err => {
      if (err) throw err
    })
  })

  const componentsDir = `${moduleStyleCapitalize}/components`
  mkdirp(componentsDir, err => {
    const indexDir = `${componentsDir}/index.js`
    fs.writeFile(indexDir, '', err => {
      if (err) throw err
    })
  })
}

const createActionsFile = ctx => {
  const {
    moduleNmae: module,
    middleware,
    moduleStyleCapitalize,
    moduleStyleUpper,
    moduleType
  } = ctx

  return fs.writeFile(
    `${capitalize(module)}/actions.js`,
    moduleType === 'module'
      ? ''
      : `import {
  ${moduleStyleUpper}_REQUEST,
  ${moduleStyleUpper}_SUCCESS,
  ${moduleStyleUpper}_FAILURE,
} from './types'
${middleware === 'redux-thunk'
          ? `import normalize from './normalize'
`
          : ''}
const action = ( type, payload = {} ) => ( { type, ...payload } )

const ${module} = {
  request: () => action( ${moduleStyleUpper}_REQUEST ),
  success: ${module} => action( ${moduleStyleUpper}_SUCCESS, { ${module} } ),
  failure: error => action( ${moduleStyleUpper}_FAILURE, { error } ),
}
${middleware === 'redux-thunk'
          ? `
const fetch${moduleStyleCapitalize} = () => {
  return dispatch => {
    dispatch( ${module}.request() )
    return fetch( 'https://jsonplaceholder.typicode.com/posts' )
      .then( res => ( res.ok ? res.json() : dispatch( ${module}.failure() ) ) )
      .then( res => normalize( res ) )
      .then( normalized => dispatch( ${module}.success( normalized ) ) )
  }
}
`
          : ''}
export { ${module}${middleware === 'redux-thunk'
          ? `, fetch${moduleStyleCapitalize}`
          : ''} }
`,
    err => {
      if (err) throw err
    }
  )
}

const createTypesFile = ctx => {
  const { moduleNmae: module, moduleStyleUpper, moduleType } = ctx

  return fs.writeFile(
    `${capitalize(module)}/types.js`,
    moduleType === 'module'
      ? ''
      : `const ${moduleStyleUpper}_FAILURE = '${moduleStyleUpper}_FAILURE'
const ${moduleStyleUpper}_REQUEST = '${moduleStyleUpper}_REQUEST'
const ${moduleStyleUpper}_SUCCESS = '${moduleStyleUpper}_SUCCESS'

export {
  ${moduleStyleUpper}_FAILURE,
  ${moduleStyleUpper}_REQUEST,
  ${moduleStyleUpper}_SUCCESS,
}
`,
    err => {
      if (err) throw err
    }
  )
}

const createReducerFile = ctx => {
  const { moduleNmae: module, moduleStyleUpper, moduleType } = ctx

  return fs.writeFile(
    `${capitalize(module)}/reducer.js`,
    moduleType === 'module'
      ? ''
      : `import {
  ${moduleStyleUpper}_FAILURE,
  ${moduleStyleUpper}_REQUEST,
  ${moduleStyleUpper}_SUCCESS,
} from './types'

export const INITIAL_STATE = {
  ${module}ById: {},
  ${module}Ids: [],
  isFetching: false,
  errorMessage: '',
}

export default ( state = INITIAL_STATE, action ) => {
  switch ( action.type ) {
  case ${moduleStyleUpper}_REQUEST:
    return { ...state, isFetching: true }
  case ${moduleStyleUpper}_SUCCESS:
    return { ...state, ...action.${module}, isFetching: false }
  case ${moduleStyleUpper}_FAILURE:
    return { ...state, isFetching: false, errorMessage: action.error }
  default:
    return state
  }
}
`,
    err => {
      if (err) throw err
    }
  )
}

const createSelectorsFile = ctx => {
  const { moduleNmae: module, moduleType } = ctx
  return fs.writeFile(
    `${capitalize(module)}/selectors.js`,
    moduleType === 'module'
      ? ''
      : `const ${module}ByIdSelector = state => state.${module}.${module}ById
const ${module}IdsSelector = state => state.${module}.${module}Ids
const isFetchingSelector = state => state.${module}.isFetching

export {
  ${module}ByIdSelector,
  ${module}IdsSelector,
  isFetchingSelector,
}
`,
    err => {
      if (err) throw err
    }
  )
}

const createSagasFile = ctx => {
  const {
    moduleNmae: module,
    moduleStyleCapitalize,
    moduleStyleUpper,
    moduleType
  } = ctx

  return fs.writeFile(
    `${capitalize(module)}/sagas.js`,
    moduleType === 'module'
      ? ''
      : `import { call, take, put, fork } from 'redux-saga/effects'
  
import { ${module} } from './actions'
import { ${moduleStyleUpper}_REQUEST } from './types'
import normalize from './normalize'

const fetchApi = () => {
  return new Promise( resolve => {
    fetch( 'https://jsonplaceholder.typicode.com/posts' ).then( res =>
      resolve( res.json() )
    )
  } )
}

function* fetch${moduleStyleCapitalize}() {
  while ( yield take( ${moduleStyleUpper}_REQUEST ) ) {
    try {
      const response = yield call( fetchApi )
      const normalized = normalize( response )
      yield put( ${module}.success( normalized ) )
    } catch ( e ) {
      yield put( ${module}.failure( e ) )
    }
  }
}

export default [ fork( fetch${moduleStyleCapitalize} ) ]`,
    err => {
      if (err) throw err
    }
  )
}

const createNormalizeFile = ctx => {
  const { moduleNmae: module, moduleStyleUpper, moduleType } = ctx

  return fs.writeFile(
    `${capitalize(module)}/normalize.js`,
    moduleType === 'module'
      ? ''
      : `const normalize = data => {
  return data.reduce(
    ( p, c ) => {
      return {
        ...p,
        ${module}ById: {
          ...p.${module}ById,
          [ c.id ]: c,
        },
        ${module}Ids: [ ...p.${module}Ids, c.id ],
      }
    },
    {
      ${module}ById: {},
      ${module}Ids: [],
    }
  )
}

export default normalize
`,
    err => {
      if (err) throw err
    }
  )
}

const createIndexFile = ctx => {
  const { moduleNmae, middleware } = ctx
  return fs.writeFile(
    `${capitalize(moduleNmae)}/index.js`,
    `import * as actions from './actions'
import * as selectors from './selectors'
import * as types from './types'
import reducer from './reducer'
${middleware === 'redux-saga'
      ? `import sagas from './sagas'
`
      : ``}
export { actions, selectors, types, reducer${middleware === 'redux-saga'
      ? ', sagas'
      : ''} }`,
    function(err) {
      if (err) throw err
    }
  )
}

const tasks = new Listr([
  {
    title: 'create folder',
    task: ({ moduleNmae }) => {
      return mkdirp(capitalize(moduleNmae), err => {})
    }
  },
  {
    title: 'create actions file',
    task: ctx => {
      return createActionsFile(ctx)
    }
  },
  {
    title: 'create types file',
    task: ctx => {
      return createTypesFile(ctx)
    }
  },
  {
    title: 'create reducer file',
    task: ctx => {
      return createReducerFile(ctx)
    }
  },
  {
    title: 'create selector file',
    task: ctx => {
      return createSelectorsFile(ctx)
    }
  },
  {
    title: 'create sagas file',
    task: ctx => {
      return createSagasFile(ctx)
    },
    skip: ctx => {
      return ctx.middleware !== 'redux-saga'
    }
  },
  {
    title: 'create normalize file',
    task: ctx => {
      return createNormalizeFile(ctx)
    }
  },
  {
    title: 'create component',
    task: ctx => {
      return createComponent(ctx)
    },
    skip: ctx => {
      return !ctx.includeComponent
    }
  },
  {
    title: 'create index file',
    task: ctx => {
      return createIndexFile(ctx)
    }
  }
])

const questions = [
  {
    type: 'input',
    name: 'moduleNmae',
    message: 'module name?'
  },
  {
    type: 'list',
    name: 'moduleType',
    message: 'Which type are you using?',
    choices: ['module', 'module ( API handle )']
  },
  {
    type: 'confirm',
    name: 'haveMiddleware',
    message: 'Do you have the middleware?'
  },
  {
    type: 'list',
    name: 'middleware',
    message: 'Which middleware are you using with redux?',
    choices: ['redux-saga', 'redux-thunk'],
    when: answers => answers.haveMiddleware
  },
  // {
  //   type: 'checkbox',
  //   message: 'Select Toppings (number 1 ~ 2)',
  //   name: 'toppings',
  //   choices: [
  //     {
  //       name: 'immutable'
  //     },
  //     {
  //       name: 'reselect'
  //     }
  //   ]
  // },
  {
    type: 'confirm',
    name: 'includeComponent',
    message: 'Do you want to add component?'
  }
]

module.exports = function run() {
  console.log(`Hi 👋 ! ${chalk.dim("Let's make your code")}}!`)
  return inquirer
    .prompt(questions)
    .then(anwsers => {
      const computedAnwsers = Object.assign(anwsers, {
        moduleStyleUpper: anwsers.moduleNmae.toUpperCase(),
        moduleStyleCapitalize: capitalize(anwsers.moduleNmae)
      })
      return tasks.run(computedAnwsers)
    })
    .then(() => console.log(`You're all set!  💅🏻`))
    .catch(err => console.error(err))
}
