import mongoose from "mongoose";

const wordSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  word: {
    type: String,
    required: true,
  },
},{timestamps:true});
const Word = mongoose.model("Word", wordSchema);
export default Word;