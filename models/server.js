// DEPENDENCIES
const express = require('express');
const app = express();
require('dotenv').config();


// PORT - LISTENER
const PORT = process.env.PORT;
app.listen(PORT, ()=>{
    console.log(`Sever is listening on port: ${PORT}`)
})