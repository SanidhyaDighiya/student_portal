const tutorialsRouter = require('express').Router()
const Tutorial = require('../models/tutorial')
const User = require('../models/user')
const jwt = require('jsonwebtoken')


const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

tutorialsRouter.get('/', async (request, response) => {
  const tutorials = await Tutorial
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(tutorials)

})

tutorialsRouter.get('/:id', async (request, response, next) => {

  const tutorial = await Tutorial.findById(request.params.id)
  if (tutorial)
    response.json(tutorial)
  else
    response.status(404).end()
})

tutorialsRouter.post('/', async (request, response, next) => {
  const body = request.body

  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  console.log(decodedToken.id)

  const user = await User.findById(decodedToken.id)

  const p = user.profession[0]
  const tutorial = new Tutorial({
    subject: body.subject,
    date: body.date,
    syllabus: body.syllabus,
    user: user._id
  })
  if (p === 'Professor') {
    const savedTutorial = await tutorial.save()
    user.tutorials = user.tutorials.concat(savedTutorial._id)
    await user.save()

    response.json(savedTutorial)
  }
  else {
    response.json('Account not permitted to create Tuts')
  }
})

tutorialsRouter.delete('/:id', async (request, response, next) => {

  await Tutorial.findByIdAndRemove(request.params.id)
  response.status(204).end()

})

tutorialsRouter.put('/:id', (request, response, next) => {
  const body = request.body

  const tutorial = {
    subject: body.subject,
    date: body.date,
    syllabus: body.syllabus,
  }

  Tutorial.findByIdAndUpdate(request.params.id, tutorial, { new: true })
    .then(updatedTutorial => {
      response.json(updatedTutorial.toJSON())
    })
    .catch(error => next(error))
})

module.exports = tutorialsRouter
