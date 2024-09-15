
//API rest + comunicación con GRPC

const express = require('express');
const mongoose = require('mongoose');
const grpc = require('@grpc/grpc-js');
require('dotenv').config() //Carga variables de entonro
const protoLoader = require('@grpc/proto-loader');
//const { create } = require('domain');
const app = express();

app.use(express.json());

//Conexión a monog

mongoose.connect(
    process.env.BD_TP,
)
.then(()=>console.log("Conectado a Mongo Db"))
.catch(err=>console.log("Error al conectar a la base de datos", err));

//Modelo de tarea
//query en mongo:
const taskSchema = new mongoose.Schema({
title: String, //columna
description: String, //column
createdAt:{type:Date, default:Date.now}
})
const Task = mongoose.model('Task', taskSchema);

//cargar el archivo proto

const PROTO_PATH = './task.proto'
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String, 
    defaults: true,
    oneofs: true
});

const taskProto = grpc.loadPackageDefinition(packageDefinition).task;
const client = new taskProto.TaskAnalysisService('localhost:50051', grpc.credentials.createInsecure());

//Endpouts rest:
//Crear una tarea
app.post('/task', async (req, res)=>{
    const {title, description} = req.body;
    const task = new Task({title, description});
    await task.save();
    res.status(201).send(task);
});
//Obtener todas las tareas
app.get('/task', async(req, res)=>{
    const tasks = await Task.find();
    res.send(tasks);
})

//Endpoint gRPC para obtener estadísticas:

app.get('/task/stats',(req, res)=>{
    client.GetTaskAnalysis({}, (err, response)=>{
        if(err) return res.status(500).send(err);
        res.send(response);
    });
});

app.get ('/task/count', (req, res) => {
    client.CountLetters({}, (err, response) => {
        if (err) return res.status(500).send(err);
        res.send(response);
    })
});


//Iniciar el servidor

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`Servidoro en puerto ${PORT}`);
});
