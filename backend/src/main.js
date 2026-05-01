import express from "express"
import botRouter from "./routes/bot-routes.js"
import cors from 'cors'

const app = express()

app.use(cors({
    origin: 'http://localhost:3000'
}))
app.use(express.json())

app.use('/api', botRouter)

const PORT = process.env.PORT

app.listen(PORT, ()=>{
    console.log(`Listening on PORT ${PORT}`)
})