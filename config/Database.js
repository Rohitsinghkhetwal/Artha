import mongoose from "mongoose";

const ConnectDatabase = async() => {
  try {
    const res = await mongoose.connect(process.env.MONGO_URI);
    if(res) {
      console.log("Mongodb Connected !")
    }

  }catch(err) {
    console.log("Error While connecting the Database ", err)
    process.exit(1);
  }

}

export default ConnectDatabase