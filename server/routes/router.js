const express = require("express");
const router = new express.Router();
const multer = require("multer");
const Clients = require('../models/client');
const Event = require('../models/event');
const Gallery = require('../models/gallery');
const moment = require("moment")
const cron = require('node-cron');

// img storage path
const imgconfig = multer.diskStorage({
    destination:(req,file,callback)=>{
        callback(null,"./uploads")
    },
    filename:(req,file,callback)=>{
        callback(null,`${Date.now()}. ${file.originalname}`)
    }
})


// img filter
const isImage = (req,file,callback)=>{
    if(file.mimetype.startsWith("image")){
        callback(null,true)
    }else{
        callback(new Error("only images is allowd"))
    }
}

const upload = multer({
    storage:imgconfig,
    fileFilter:isImage
});


// user register
router.post("/addClient", upload.single("image"), async (req, res) => {
    console.log(req.body);
    const imageName = req.file ? req.file.path : 'uploads/profile.png';
    const checkedValues = JSON.parse(req.body.checkedValues);


    if (!Array.isArray(checkedValues)) {
        return res.status(400).json({ message: 'Invalid values' })
    }

    const { name, fname, mobileno, dob, weight, address } = req.body

    try {
        await Clients.create({ image: imageName, name, fname, mobileno, dob, weight, address, checkedValues }).then;
        res.json({ status: "ok" });
    } catch (error) {
        res.json({ status: error });
    }
});


// ===============get clients with limits=================

router.get("/getUsers", async (req, res) => {
    try {
        Clients.find({})
            .sort({ createdAt: -1 }) // Sort by creation date in descending order
            .limit(5) // Limit to 5 users
            .then((data) => {
                res.send({ status: "ok", data: data });
            });
    } catch (error) {
        res.json({ status: error });
    }
});



// =================get all clients with paginations================


router.get('/paginatedUsers', async (req, res) => {

    let query = {};
    const searchData = req.query.search;
    if (searchData) {
        query = {
            $or: [
                { name: { $regex: searchData, $options: "i" } }
            ],
        };
    }

    const allUsers = await Clients.find(query);
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const startIndex = (page - 1) * limit;
    const lastIndex = (page) * limit;

    const results = {}
    results.totalUsers = allUsers.length;
    results.pageCount = Math.ceil(allUsers.length / limit)

    if (lastIndex < allUsers.length) {
        results.next = {
            page: page + 1,
        }
    }

    if (startIndex > 0) {
        results.prev = {
            page: page - 1,
        }
    }

    results.result = allUsers.slice(startIndex, lastIndex)
    res.json(results);
})


// ==============update the client status false====================

router.put('/update-status/:id', async (req, res) => {
    const usersId = req.params.id
    const allUsers = await Clients.findByIdAndUpdate(usersId, { $set: { status: false } })
    res.status(200).json(allUsers)
})

// ==============update the client status true====================

router.put('/addUser/:id', async (req, res) => {
    const usersId = req.params.id
    const allUsers = await Clients.findByIdAndUpdate(usersId, { $set: { status: true } })
    res.status(200).json(allUsers)
})

// ================delete the client================

// router.delete('/deleteUser/:id', async (req, res) => {
//     const usersId = req.params.id
//     const allUsers = await Clients.findByIdAndDelete(usersId)
//     res.status(200).json(allUsers)
// })



// ===============update the client================


router.put('/userUpdate/:id', upload.single("image"), async (req, res) => {
    const id = req.params.id

    const { name, fname, mobileno, dob, weight, address, fees, duration, enddate } = req.body;

    await Clients.findOneAndUpdate({ _id: id }, { name, fname, mobileno, dob, weight, address, fees, duration, enddate })
        .then((result) => res.json(result))
        .catch((err) => res.json(err))
});


// =============calendar Events Routes=================

router.post('/create-event', async (req, res) => {
    const event = Event(req.body);
    await event.save()
    res.sendStatus(201)
})

router.get('/get-event', async (req, res) => {
    const events = await Event.find({
        start: { $gte: moment(req.query.start).toDate() },
        end: { $lte: moment(req.query.end).toDate() }
    });

    res.send(events)
})

router.get("/getAllEvents", async (req, res) => {
    try {
        Event.find({})
            .then((data) => {
                res.send({ status: "ok", data: data });
            });
    } catch (error) {
        res.json({ status: error });
    }
});

router.delete('/deleteEvent/:id', async (req, res) => {
    const usersId = req.params.id
    const allUsers = await Event.findByIdAndDelete(usersId)
    res.status(200).json(allUsers)
})


// =================fees reminder=================

function isBirthday(user) {
    return moment().isSame(user.enddate, 'day');
}

// Cron job function
async function checkBirthdays() {
    try {
        const users = await Clients.find({ enddate: { $type: 'string' } });

        const birthdaysToday = users.filter(user => isBirthday(user));

        return birthdaysToday;
    } catch (error) {
        console.error('Error checking Notifications:', error);
        throw error;
    }
}

// Schedule the cron job to run hourly
cron.schedule('*/10 * * * * *', () => {
    checkBirthdays().then(data => {
        // console.log('Birthdays today:', data);
        // In a real application, you might want to send this data to a queue or cache system
    }).catch(error => {
        console.error('Cron job failed:', error);
    });
});


router.post('/notifications', async (req, res) => {
    try {
        const birthdays = await checkBirthdays();
        res.json(birthdays);
    } catch (error) {
        console.error('Error fetching Notifications:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





// ===========Add Gallery===================


router.post("/addGallery", upload.single("image"), async (req, res) => {
    const imageName = req.file.filename;

    console.log(imageName);


    try {
        await Gallery.create({ image: imageName }).then;
        res.json({ status: "ok" });
    } catch (error) {
        res.json({ status: error });
    }
})

router.get("/getAllImages", async (req, res) => {
    try {
        Gallery.find({})
            .then((data) => {
                res.send({ status: "ok", data: data });
            });

    } catch (error) {
        res.json({ status: error });
    }
});



// ===============Birthday Reminder===============


// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
let upcomingBirthdayUsers = []; // Temporary storage for users with birthdays in 7 days

// Schedule a Cron job to run every day at 9:00 AM
cron.schedule('*/10 * * * * *', async () => {
    const sevenDaysFromNow = moment().add(7, 'days');
    const targetMonth = sevenDaysFromNow.month() + 1; // 0-indexed in moment
    const targetDay = sevenDaysFromNow.date();

    // console.log(`Checking for birthdays on ${targetDay}/${targetMonth}`);

    try {
        // Query MongoDB to find users with birthdays 7 days from now (ignoring year)
        const users = await Clients.find({
            $expr: {
                $and: [
                    { $eq: [{ $dayOfMonth: "$dob" }, targetDay] },
                    { $eq: [{ $month: "$dob" }, targetMonth] }
                ]
            }
        });

        // console.log('Fetched users:', users);

        upcomingBirthdayUsers = users; // Store users in memory
        users.forEach(user => {
        });
        checkUsersBirthdays();
        // console.log('Users with birthdays in 7 days:', users.name);
    } catch (error) {
        console.error('Error fetching users with upcoming birthdays:', error);
    }
});


// Export the upcoming birthday users
const getUpcomingBirthdayUsers = () => upcomingBirthdayUsers;

// Define an API route to get users with birthdays in 7 days
router.get('/upcoming-birthday-users', (req, res) => {
    const users = getUpcomingBirthdayUsers();
    res.json(users);
});


let todaysBirthdays = [];
const checkUsersBirthdays = async () => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;

    try {
        // Query to find users whose birthday is today
        const birthdaysToday = await Clients.aggregate([
            {
                $project: {
                    day: { $dayOfMonth: "$dob" },
                    month: { $month: "$dob" },
                    name: 1,
                    dob: 1,
                    mobileno: 1,
                }
            },
            {
                $match: {
                    day: currentDay,
                    month: currentMonth
                }
            }
        ]);

        // console.log(birthdaysToday);


        // Update the global array with today's birthdays
        todaysBirthdays = birthdaysToday;
    } catch (error) {
        console.error('Error fetching birthdays:', error);
    }
};


checkUsersBirthdays();

// API endpoint to serve today's birthdays to the frontend
router.get('/birthdays', (req, res) => {
    res.json(todaysBirthdays);
});

module.exports = router;
