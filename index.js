const mkdirp = require('mkdirp')
const fs = require('fs-promise')
const Listr = require('listr')
const inquirer = require('inquirer')
const chalk = require('chalk')

const createComponent = module => {
  const moduleStyleUpper = module.toUpperCase()

  const containersDir = module + '/containers'
  mkdirp(containersDir, err => {
    const indexDir = containersDir + '/index.js'
    fs.writeFile(indexDir, '', err => {
      if (err) throw err
    })
  })

  const componentsDir = module + '/components'
  mkdirp(componentsDir, err => {
    const indexDir = componentsDir + '/index.js'
    fs.writeFile(indexDir, '', err => {
      if (err) throw err
    })
  })
}

const createActionsFile = module => {
  const moduleStyleUpper = module.toUpperCase()

  return fs.writeFile(
    `${module}/actions.js`,
    `const action = ( type, payload = {} ) => ( { type, ...payload } )

const ${module} = {
  request: () => action( ${moduleStyleUpper}_REQUEST ),
  success: ${module} => action( ${moduleStyleUpper}_SUCCESS, { products } ),
  failure: error => action( ${moduleStyleUpper}_FAILURE, { error } ),
}

export {
  ${module},
}
    `,
    err => {
      if (err) throw err
    }
  )
}

const createTypesFile = module => {
  const moduleStyleUpper = module.toUpperCase()

  return fs.writeFile(
    `${module}/types.js`,
    `const ${moduleStyleUpper}_FAILURE = '${moduleStyleUpper}_FAILURE'
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

const createReducerFile = module => {
  const moduleStyleUpper = module.toUpperCase()

  return fs.writeFile(
    `${module}/reducer.js`,
    `import {
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

const createSelectorsFile = module => {
  return fs.writeFile(
    `${module}/selectors.js`,
    `const ${module}ByIdSelector = state => state.${module}.${module}ById
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

const createSagaFile = module => {
  return fs.writeFile(`${module}/saga.js`, ``, err => {
    if (err) throw err
  })
}

const createIndexFile = ctx => {
  const { moduleNmae, middleware } = ctx
  return fs.writeFile(
    `${moduleNmae}/index.js`,
    `import * as actions from './actions'
import * as selectors from './selectors'
import * as types from './types'
import reducer from './reducer'
${middleware === 'redux-saga'
      ? `import saga from './saga'
`
      : ``}
export { actions, selectors, types, reducers${middleware === 'redux-saga'
      ? ', saga'
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
      return mkdirp(moduleNmae, err => {})
    }
  },
  {
    title: 'create actions file',
    task: ({ moduleNmae }) => {
      return createActionsFile(moduleNmae)
    }
  },
  {
    title: 'create types file',
    task: ({ moduleNmae }) => {
      return createTypesFile(moduleNmae)
    }
  },
  {
    title: 'create reducer file',
    task: ({ moduleNmae }) => {
      return createReducerFile(moduleNmae)
    }
  },
  {
    title: 'create selector file',
    task: ({ moduleNmae }) => {
      return createSelectorsFile(moduleNmae)
    }
  },
  {
    title: 'create saga file',
    task: ({ moduleNmae }) => {
      return createSagaFile(moduleNmae)
    },
    skip: ctx => {
      return ctx.middleware !== 'redux-saga'
    }
  },
  {
    title: 'create component',
    task: ({ moduleNmae }) => {
      return createComponent(moduleNmae)
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
    choices: ['module', 'module (handle fetching)']
  },
  {
    type: 'confirm',
    name: 'includeComponent',
    message: 'include Component?'
  },
  {
    type: 'confirm',
    name: 'haveMiddleware',
    message: 'Do you have the middleware?'
  },
  {
    type: 'list',
    name: 'middleware',
    message: 'Which middleware are you using with redux',
    choices: ['redux-thunk', 'redux-saga'],
    when: answers => answers.haveMiddleware
  }
]

module.exports = function run() {
  console.log(`Hi 👋 ! ${chalk.dim("Let's make your code")}}!`)
  return inquirer
    .prompt(questions)
    .then(anwsers => {
      console.log('anwsers', anwsers)
      return tasks.run(anwsers)
    })
    .then(() => console.log(`You're all set!  💅🏻`))
    .catch(err => console.error(err))
}
