require("dotenv").config();
const express = require("express");
const app = express();
require("./db/conn");
const router = require("./routes/router");
const cors = require("cors");


const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
const crossOptions = {
    origin: "https://zenith-gym.vercel.app",
    credentials: true
}
app.use(cors(crossOptions))
app.use(router);
app.use(express.urlencoded({ extended: true }));


app.use("/uploads", express.static("./uploads"));


app.get('/', (req, res) => {
    return res.json({ message: "Sucessfully" })
})

app.listen(port, () => {
    console.log(`server start at port no ${port}`)
})
