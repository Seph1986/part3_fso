// MODULES IMPORT
const express = require('express')
const env = require('dotenv') //IMPORTANT: import dotenv before any model
const Note = require('./models/note')


const app = express()
env.config()


// MY OWN MIDDLEWARE
const requestLogger = (request, response, next) => {
  console.log(`Method: ${request.method}`)
  console.log(`Path: ${request.path}`)
  console.log(`Body: ${request.body}`)
  console.log('----')

  next()
}

// MIDDLEWARES
// By default express.static uses 'the root url'
app.use(express.static('build'))
app.use(express.json())
app.use(requestLogger)


// ALL NOTES
app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes)
  })
})


// FIND NOTE BY ID
app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id)
    .then(note => {
      if (note) {
        response.json(note)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})


// ADDING NOTES
app.post('/api/notes/', (request, response, next) => {
  const body = request.body

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date(),
  })

  note
    .save()
    .then(savedNote => savedNote.toJSON())
    .then(savedAndFormattedNote => {
      response.json(savedAndFormattedNote)
    })
    .catch(err => next(err))
})


// DELETE NOTE BY ID
app.delete('/api/notes/:id', (request, response, next) => {
  Note.findByIdAndDelete(request.params.id)
    .then(result => {
      console.log(result)
      response.status(204).end()
    })
    .catch(error => next(error))
})


// EDIT NOTE IMPORTANCE BY ID
app.put('/api/notes/:id', (request, response, next) => {
  const body = request.body

  const note = {
    content: body.content,
    important: body.important,
  }

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})


// ERROR HANDLER
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)


// UNKNOWN HANDLER
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)


const PORT = process.env.PORT || 3008 //eslint-disable-line
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})