const mongoose=require('mongoose');

const connetDB=async()=>{
    await mongoose.connect(`${process.env.MONGO_URL}`).then(()=>console.log(`MongoDb connected`)).catch((err)=>console.log(err));
}

module.exports=connetDB;