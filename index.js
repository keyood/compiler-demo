'use strict'

function tokenizer (input) {
  let current = 0
  let tokens = []
  while (current < input.length) {
    let char = input[current]
    // 判断字符
    let LETTERS = /[a-z]/i
    if (LETTERS.test(char)) {
      let value = ''
      while (LETTERS.test(char)) {
        value += char
        char = input[++current]
      }
      // 判断 let|var|const
      if (/let|var|const/.test(value)) {
        tokens.push({
          type: 'variable',
          value
        })
      } else {
        // 其他情况为变量
        tokens.push({
          type: 'identifier',
          value
        })
      }
      continue
    }
    // 判断 =
    let OPERATOR = /\=/
    if (OPERATOR.test(char)) {
      current++
      tokens.push({
        type: 'operator',
        value: char
      })
      continue
    }
    // 判断空格
    let WHITESPACE = /\s/
    if (WHITESPACE.test(char)) {
      current++
      continue
    }
    // 判断数字
    let NUMBERS = /[0-9]/
    if (NUMBERS.test(char)) {
      let value = ''
      while (NUMBERS.test(char)) {
        value += char
        char = input[++current]
      }
      tokens.push({
        type: 'number',
        value
      })
      continue
    }
    // 判断字符串
    if (char === '"') {
      let value = ''
      char = input[++current]
      while (char !== '"') {
        value += char
        char = input[++current]
      }
      char = input[++current]
      tokens.push({
        type: 'string',
        value
      })
      continue
    }
    throw new TypeError('I dont know what this character is: ' + char)
  }
  return tokens
}

function parser (tokens) {
  let current = 0
  function walk () {
    let token = tokens[current]
    if (!token) {
      return
    }
    if (token.type === 'variable') {
      let delclarations = [{
        type: 'VariableDeclarator'
      }]
      current++
      for (let i = 0; i < current; i++) {
        let walked = walk()
        if (walked) {
          if (walked.type === 'Identifier') {
            delclarations[0]['id'] = walked
          } else if (walked.type === 'Literal') {
            delclarations[0]['init'] = walked
          }
        }
      }
      return {
        type: 'VariableDeclaration',
        kind: token.value,
        delclarations: delclarations
      }
    }
    if (token.type === 'identifier') {
      current++
      return {
        type: 'Identifier',
        name: token.value
      }
    }
    if (token.type === 'operator') {
      current++
      return
    }
    if (token.type === 'number') {
      current++
      return {
        type: 'Literal',
        value: token.value
      }
    }
    if (token.type === 'string') {
      current++
      return {
        type: 'Literal',
        value: token.value
      }
    }

    throw new TypeError(token.type)
  }
  let ast = {
    type: 'Program',
    body: []
  }
  while (current < tokens.length) {
    ast.body.push(walk())
  }
  return ast
}

// 遍历函数
function traverser (ast, visitor) {
  // 处理数组
  function traverseArray (array, parent) {
    array.forEach(child => {
      traverseNode(child, parent)
    })
  }
  // 处理节点对象
  function traverseNode (node, parent) {
    let methods = visitor[node.type]
    if (methods && methods.enter) {
      methods.enter(node, parent)
    }
    switch (node.type) {
      case 'Program':
        traverseArray(node.body, node)
        break
      case 'VariableDeclaration':
        traverseArray(node.delclarations, node)
        break
      case 'VariableDeclarator':
        break
      default:
        throw new TypeError(node.type)
    }
    if (methods && methods.exit) {
      methods.exit(node, parent)
    }
  }
  traverseNode(ast, null)
}

function transformer (ast) {
  let newAst = {
    type: 'Program',
    body: []
  }
  ast._context = newAst.body
  traverser(ast, {
    VariableDeclaration: {
      enter (node, parent) {
        let expression = {
          type: 'VariableDeclaration',
          kind: 'var',
          delclarations: []
        }
        node._context = expression.delclarations
        parent._context.push(expression)
      }
    },
    VariableDeclarator: {
      enter (node, parent) {
        parent._context.push(node)
      }
    }
  })
  return newAst
}

function codeGenerator (node) {
  switch (node.type) {
    case 'Program':
      return node.body.map(codeGenerator).join(' ')
    case 'VariableDeclaration':
      return node.kind + ' ' + node.delclarations.map(codeGenerator).join(' ')
    case 'VariableDeclarator':
      return node.id.name + ' = ' + node.init.value
    default:
      throw new TypeError(node.type)
  }
}

function compiler (input) {
  let tokens = tokenizer(input)
  let ast = parser(tokens)
  let newAst = transformer(ast)
  let output = codeGenerator(newAst)
  return output
}
module.exports = {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler
}