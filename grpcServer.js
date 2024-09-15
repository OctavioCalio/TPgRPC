//Servidor grpc

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
require('dotenv').config() //Carga variables de entonro
//conexión a mongo

mongoose.connect(
    process.env.BD_TP,
)
.then(()=>console.log("Conectado a Mongo Db"))
.catch(err=>console.log("Error al conectar a la base de datos", err));

//Modelo de tarea
const taskSchema = new mongoose.Schema({
    title: String,
    description : String,
    createdAt: {type: Date, default: Date.now}
})
const Task = mongoose.model('Task', taskSchema);

//Cargar el archivo proto

const PROTO_PATH = './task.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const taskProto = grpc.loadPackageDefinition(packageDefinition).task;

//Crear servidor grpc
console.log(taskProto);
const grpcServer = new grpc.Server();


grpcServer.addService(taskProto.TaskAnalysisService.service, {
    //conteo de tareas
    GetTaskAnalysis: async (call, callback) =>{
        console.log("Solicitud gRPC recibida");
         try {
            const totalTasks = await Task.countDocuments();
            console.log("Total de tareas en la base de datos:", totalTasks);
            const response = {total_tasks: totalTasks};
            console.log("Respuesta que se va a enviar:", response);
            callback(null, response);
        } catch (error) {
            console.error("Error en GetTaskStats:", error);
               callback(error);
         }
    },
    //conteo de letras
    CountLetters: async (call, callback) => {
       console.log("Solicitud gRPC contar letras recibida");
        try {
            const tasks = await Task.find({});
            let LetterCount = 0;

            tasks.forEach (
                task => {
                    const taskText = (task.title + ' ' + task.description).toLowerCase();
                    const contA = (taskText.match(/a/g) || []).length;
                    LetterCount += contA;
                }
            )
            
            const response = {total_letter_count : LetterCount};
            console.log("Letas 'a' encontradas (sin contar id):", LetterCount);
                  callback(null, response);            
        } catch (error) {
              console.error("Error en CountLetterInTask:", error);
              callback(error);
        }
    }
});

//Iniciar el servidor

grpcServer.bindAsync('localhost:50051', grpc.ServerCredentials.createInsecure(), () =>
    {
        console.log('Servidor grpc en puerto 50051');
        grpcServer.start();
    }
);

