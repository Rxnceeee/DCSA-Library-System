import express from 'express'
import { checkUsername,checkStudentNumberInAccount,checkStudentNumber,checkEmailAddress,checkPhoneNumber,registerStudent,createAccount,getStudents,updateStudentDetails, isValidAccount,changePassword,getUserInfo,isValidUsernamePasswordAdmin,getBookNumber,registerBook,getBooksByCategory, getVerifiedStudents,getUnverifiedStudents,checkAccountStatusByUsername,getStudentAccountInfo,verifyAccountRequest,deleteAccountRequest,borrowBook,updateBookStocks,decrementBookStocks,getBookRequest,rejectBookRequest,approveBookRequest,getBorrowedBooks,searchBorrowedBooksByStudentNumber,returnBook,incrementBookStocks,getStudentBookHistory, getAllBooks,getMainDashboardInfo,getAllVerifiedStudents,getReturnedBooks,getBookTransactionHistory,updateTransactionStatus,expireBorrowRequest,borrowCount,getStudentUnpaidPenaltyCount,getStudentUnreplacedPenaltyCount,getStudentUnrepairedPenaltyCount,getOverDueBooks,getPenaltyBooks,getAllOverDueBooks,getPersonalDetails,getStudentPenalty,getStudentOverdue,getBookTransactionStatus,returnBookAsLost,returnBookAsDamage,returnBookAsMinimalDamage,getDamageBooks,getDamageBooksByStudentNumber,getLostBooks,getLostBooksByStudentNumber, getBookDetails, getBookTransactions,getPendingPenaltyBooks,updatePendingPenalty,getToBuyBooks,getToRepairBooks,getBooksBySearch,searchBookFilteredByCategory,updateTransactionStatusByTransactionID,checkAccountStatusByStudentNumber,getBorrowRequestBookByStudentNumber, getBooksByCategoryLimit10} from './db.js';
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'


const educationalBooksCategory ='Educational Book'
const generalReadingBooksCategory = 'General Reading'
const researchReferencesBooksCategory ='Research References'
const fictionBooksCategory='Fiction'

const repaired ='REPAIRED'
const replaced='REPLACED'
const severeDamage ='SEVERE DAMAGE'
const minimalDamage= 'MINIMAL DAMAGE'
const mildDamage ='MILD DAMAGE'
const lost ='LOST'
const rejected ='REJECTED'
const paid ='PAID'

const app = express()
const PORT = 5000
app.use(cors())
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')));
app.use('/imageUploads', express.static(path.join(__dirname, 'imageUploads')))

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'imageUploads/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
const upload = multer({ storage })

app.get('/education', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "educationalBook.html"))
})

app.get('/generalReading', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "generalReadingBook.html"))
})

app.get('/fiction', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "fictionBook.html"))
})

app.get('/researchReferences', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "researchReferencesBook.html"))
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "login.html"))
})

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "about.html"))
})

app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "index.html"))
})

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "admin.html"))
})

app.get('/registerSuccessful', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "registrationSuccessful.html"))
})

app.get('/verified', async(req,res)=>{
    const students = await getVerifiedStudents()
    res.send(students)
})

app.get('/unverified', async(req,res)=>{
    const students = await getUnverifiedStudents()
    res.send(students)
})

app.put('/account', async(req,res)=>{
    const {id,action} = req.body
    await verifyAccountRequest(id,action)
    res.json({message:`Student Successfully ${action}`})
})

app.delete('/account', async(req,res)=>{
    const {id,studentNumber,action} = req.body
    await deleteAccountRequest(id,studentNumber)
    res.json({message:`Student Successfully ${action}`})

})

app.post('/setAccount', async(req,res)=>{
    try {
        const {username} = req.body
        const userInfo = await getUserInfo(username)
        res.send(userInfo)
    } catch (error) {
        console.error(error.message)
    }
})
app.put('/changePassword', async(req,res)=>{
    const {currentPassword,newPassword,username} = req.body
    const isCurrentPasswordMatch = await isValidAccount(username,currentPassword)

    if(!isCurrentPasswordMatch) return res.json({message:'Incorrect Password!'})
    const affectedRows = await changePassword(username,newPassword)
    if(affectedRows) return res.status(201).json({message:'Password Change Successfully!'})

})

app.put('/forgotPassword', async(req,res)=>{
    const {newPassword,username} = req.body
    
    const affectedRows = await changePassword(username,newPassword)
    if(affectedRows) return res.status(201).json({message:'Password Change Successfully!'})
})


app.post('/importantNotice', async (req, res) => {
    const { studentNumber } = req.body;
    const overDueBooks = await getOverDueBooks(studentNumber)

    if (overDueBooks.length > 0) {
        return res.json(overDueBooks);
    } else {
        res.json({ message: "No overdue books found" });
    }
});

app.put ('/updateTransactionStatus', async(req,res)=>{
    const {currentDate} = req.body
    await updateTransactionStatus(currentDate)
})

app.put('/bookRequestExpiration', async (req, res) => {
    const { currentDateTime } = req.body
    await expireBorrowRequest(currentDateTime)

    
});

app.post('/registerStudent',async(req,res)=>{
    try {
        const {studentNumber,firstName,lastName,middleName,yearGradeLevel,courseStrand,phoneNumber,emailAddress,username,password,dateTimeRegistered}=req.body
        const isStudentNumberExist = await checkStudentNumber(studentNumber);
        const isPhoneNumberExist = await checkPhoneNumber(phoneNumber);
        const isEmailAddressExist = await checkEmailAddress(emailAddress);
        const isUsernameExist = await checkUsername(username);


        if(isStudentNumberExist) return res.status(500).json({message:'Student Number Already exist'})
        if(isPhoneNumberExist) return res.status(500).json({message:'Phone Number Already exist'})
        if(isEmailAddressExist) return res.status(500).json({message:'Email Address Already exist'})
        if(isUsernameExist) return res.status(500).json({message:'Username Already exist'})

        await registerStudent(studentNumber,firstName,lastName,middleName,yearGradeLevel,courseStrand,phoneNumber,emailAddress)
        await createAccount(studentNumber,username,password,dateTimeRegistered)
        res.status(201).json({message:'Student Registered Succesfully'})
    } catch (error) {
        console.error(error)
        res.status(500).json({message:'Error registering student'})
    }
})

app.get('/students', async(req,res)=>{
    const students=await getStudents()
    res.send(students)
})

app.put('/student', async (req, res) => {
    const {studentNumber,lastName, firstName, middleName, yearGradeLevel, courseStrand, phoneNumber, emailAddress, studentID } = req.body;

    const affectedRows = await updateStudentDetails(studentNumber, lastName, firstName, middleName, yearGradeLevel, courseStrand, phoneNumber, emailAddress, studentID);
    if (affectedRows) return res.send({ message: ` ${lastName} Updated Successfsssully` });
});

app.post('/loginStudent', async(req, res)=>{

    const {username,password} =req.body
    const isUsernamePasswordMatch = await isValidAccount(username,password);
    
    if(isUsernamePasswordMatch){
        const isAccountStatusVerified = await checkAccountStatusByUsername(username)
        if(isAccountStatusVerified) return res.status(200).json({message:'Login Succesfully'})
        return res.status(403).json({message:`Unverified Account Status! Please wait for Library Admin's Approval`})
    }else{
        return res.status(404).json({message:`Invalid Username or Password`})
    }
})

app.post('/loginAdmin', async(req,res)=>{
    try {
        const {username,password}=req.body
        const isMatch = await isValidUsernamePasswordAdmin(username,password);
        if(isMatch) return res.status(200).json({message:'Login Succesfully'})

        res.status(401).json({message:'Wrong Username or Password'})
    } catch (error) {
        console.error(error)
        res.status(500).json({message:error.message})
    }
})

app.post('/registerBook', upload.single('frontCover'), async (req, res) => {
    try {
        const { bookNumber, bookAuthor, bookTitle, bookCategory, bookDescription, bookStocks } = req.body;

        const isBookNumberExist = await getBookNumber(bookNumber);
        if (isBookNumberExist) return res.status(400).json({ message: 'Book Number Already Exists' });
        if (!req.file) {
            return res.status(400).json({ message: "Front cover image is required." });
        }

        const frontCover = req.file.filename;
        await registerBook(bookNumber, bookAuthor, bookTitle, bookCategory, bookDescription, frontCover, bookStocks);
        res.status(201).json({ message: "Book Successfully Registered" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error registering book" });
    }
});

app.get('/books', async(req,res)=>{
    const books = await getAllBooks()
    res.send(books)
})

app.put('/updateBookStocks', async(req,res)=>{
    const {bookID,bookStocks} = req.body
    const affectedRows = await updateBookStocks(bookID,bookStocks)
    if(affectedRows) res.send({message:'Book Stocks Updated Successfully'})
})


//books category request routes start
app.get('/educationalBooksIndex', async(req,res)=>{
    const educationalBooks= await getBooksByCategoryLimit10(educationalBooksCategory)
    res.send(educationalBooks)
    
})

app.get('/fictionBooksIndex', async(req,res)=>{
    const fictionalBooks= await getBooksByCategoryLimit10(fictionBooksCategory)
    res.send(fictionalBooks)
    
})

app.get('/generalReadingBooksIndex', async(req,res)=>{
    const generalReadingBooks= await getBooksByCategoryLimit10(generalReadingBooksCategory)
    res.send(generalReadingBooks)
})
app.get('/researchReferencesBooksIndex', async(req,res)=>{
    const researchReferencesBooks= await getBooksByCategoryLimit10(researchReferencesBooksCategory)
    res.send(researchReferencesBooks)
    
})

app.get('/educationalBooks', async(req,res)=>{
    const educationalBooks= await getBooksByCategory(educationalBooksCategory)
    res.send(educationalBooks)
})
app.get('/fictionBooks', async(req,res)=>{
    const fictionalBooks= await getBooksByCategory(fictionBooksCategory)
    res.send(fictionalBooks)
})

app.get('/generalReadingBooks', async(req,res)=>{
    const generalReadingBooks= await getBooksByCategory(generalReadingBooksCategory)
    res.send(generalReadingBooks)  
})

app.get('/researchReferencesBooks', async(req,res)=>{
    const researchReferencesBooks= await getBooksByCategory(researchReferencesBooksCategory)
    res.send(researchReferencesBooks)
})
//books category request routes end


app.post('/requestBook', async(req,res)=>{
    const {bookNumber,studentNumber,dateTimeBooked}= req.body

    const overdueBooks = await getOverDueBooks(studentNumber)
    const borrowCounts = await borrowCount(studentNumber)
    const unpaidPenaltyCount = await getStudentUnpaidPenaltyCount(studentNumber)
    const unreplacedPenaltyCount = await getStudentUnreplacedPenaltyCount(studentNumber)
    const unrepairedPenaltyCount = await getStudentUnrepairedPenaltyCount(studentNumber)


    if(unpaidPenaltyCount > 0) return res.json({ message: 'Booking cannot proceed. Unpaid penalties must be settled before making a new transaction.' });
    if(unreplacedPenaltyCount > 0) return res.json({ message: 'Booking cannot proceed. Unreplaced penalties must be settled before making a new transaction.' });
    if(unrepairedPenaltyCount > 0) return res.json({ message: 'Booking cannot proceed. Unrepaired penalties must be settled before making a new transaction.' });
    if(overdueBooks.length > 0) return res.json({message:`'Booking cannot proceed. Overdue books must be return before making a new transaction.'`})
    if(borrowCounts > 2) return res.json({message:`Booking cannot proceed. Borrow Limit exceeds`})
        
    const inserAffectedRows = await borrowBook(bookNumber,studentNumber,dateTimeBooked)
    if(inserAffectedRows) res.status(201).json({message:`Successfully Booked `})
})

app.get('/bookRequest', async(req,res)=>{
    const bookRequest= await getBookRequest()
    if(bookRequest) res.send(bookRequest)
})

app.put('/handleRequest', async(req,res)=>{
    const {transactionID,action,dateTimeClaimed,dateToBeReturn,bookNumber} = req.body
    try {
        if(action === rejected ) {
            await rejectBookRequest(transactionID,action);
            res.json({message:`Successfully ${action}`})
        }else{
            await approveBookRequest(transactionID,action,dateTimeClaimed,dateToBeReturn)
            await decrementBookStocks(bookNumber) 
            res.json({message:`Successfully ${action}`})
        }
    } catch (error) {
        console.error(error)
    }
    
})



app.get('/borrowedBooks', async(req,res)=>{
    const borrowedBooks = await getBorrowedBooks()
    res.send(borrowedBooks)
})

app.put('/returnBook',async(req,res)=>{
    const {transactionID,dateTimeReturned,dateReported,returnCondition,returnPenalty,bookNumber,transactionStatus}= req.body

    if(transactionStatus === replaced || transactionStatus === repaired) incrementBookStocks(bookNumber)
    if(returnCondition == lost){
        await returnBookAsLost(transactionID,dateReported,returnCondition,returnPenalty,transactionStatus)
        res.send({message:`Book was ${returnCondition}. Note that penalties must be held!`})
    }else if(returnCondition == severeDamage ||returnCondition == mildDamage){
        await returnBookAsDamage(transactionID,dateReported,returnCondition,returnPenalty,transactionStatus)
        res.send({message:`Book has ${returnCondition}. Note that penalties must be held!`})
    }else if( returnCondition == minimalDamage){
        await returnBookAsMinimalDamage(transactionID,dateReported,dateTimeReturned,returnCondition,returnPenalty)
        await incrementBookStocks(bookNumber)
        res.send({message:`Book has ${returnCondition}. Note that student must attend a library service!`})
    } else{
        const returnAffectedRows= await returnBook(transactionID,dateTimeReturned,returnCondition)
        const updateAffectedRows = await incrementBookStocks(bookNumber)
        if(returnAffectedRows && updateAffectedRows) res.send({message:`Book Succesffully Returned! as ${returnCondition}`})
    }
})

app.post('/studentBookHistory', async(req,res)=>{
    const {studentNumber} = req.body
    const studentBookHistory= await getStudentBookHistory(studentNumber)
    res.send(studentBookHistory)
})

app.get('/mainDashBoard', async(req,res)=>{
    try {
        const mainDashBoardInfo = await getMainDashboardInfo();
        res.json(mainDashBoardInfo);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ error: "Server Error" });
    }
})

app.get('/bookTransactions', async(req,res)=>{
    const bookTransactionHistory = await getBookTransactionHistory()
    res.json(bookTransactionHistory)

})

app.get('/overdueBooks', async(req,res)=>{
    const overdueBooks = await getAllOverDueBooks()
    res.send(overdueBooks)
})

app.get('/searchStudentAccount/:studentNumber', async (req, res) => {
    const studentNumber = parseInt(req.params.studentNumber, 10);

    if (isNaN(studentNumber)) return res.status(404).json({ message: 'Invalid student number format!' })
    const studentNumberExist = await checkStudentNumberInAccount(studentNumber);
    if (!studentNumberExist) return res.status(404).json({ message: `Student Number Doesn't Exist!` })

    const studentAccountInfo = await getStudentAccountInfo(studentNumber)
    res.send(studentAccountInfo)
})

app.get('/searchStudentBorrowRequest/:studentNumber', async (req, res) => {

    const studentNumber = parseInt(req.params.studentNumber, 10);
    const studentNumberExist = await checkStudentNumber(studentNumber)
    if(!studentNumberExist) return res.status(404).json({message:'Student Number doesnt Exist!'})

    const studentNumberVerified = await checkAccountStatusByStudentNumber(studentNumber)
    if(!studentNumberVerified) return res.status(404).json({message:'Unverified Account Status!'})

    const borrowedBooks = await getBorrowRequestBookByStudentNumber(studentNumber)
    res.send(borrowedBooks)
})

app.post('/searchBorrowedBooksByStudentNumber', async(req,res)=>{
    const {studentNumber} = req.body
    
    const isStudentNumberExist = await checkStudentNumber(studentNumber)
    if(!isStudentNumberExist) return res.status(404).json({message:`Student Number Does'nt Exist`})

    const studentNumberVerified = await checkAccountStatusByStudentNumber(studentNumber)
    if(!studentNumberVerified) return res.status(404).json({message:'Unverified Account Status!'})
    const borrowedBooks = await searchBorrowedBooksByStudentNumber(studentNumber)
    res.json(borrowedBooks)

})

app.post('/searchStudentNumber', async(req,res)=>{
    const {studentNumber} =req.body

    const isStudentNumberExist = await checkStudentNumber(studentNumber)
    if(!isStudentNumberExist) return res.status(404).json({message:`Student Number Does'nt Exist`})

    const studentBookHistory = await getStudentBookHistory(studentNumber)
    const studentDetails = await getPersonalDetails(studentNumber)
    const studentPenalty = await getStudentPenalty(studentNumber)
    const studentOverdue = await getStudentOverdue(studentNumber)
    res.status(220).json({studentBookHistory,studentDetails,studentPenalty,studentOverdue})
})
app.post('/searchBookNumber', async(req,res)=>{
    const {bookNumber} =req.body
    const isBookNumberExist = await getBookNumber(bookNumber)
    if(!isBookNumberExist) return res.status(404).json({message:`Book Number Does'nt Exist`})
    const bookDetails = await getBookDetails(bookNumber)
    const bookTransactions = await getBookTransactions(bookNumber)
    res.status(220).json({bookDetails,bookTransactions})
})

app.get('/damageBooks', async(req,res)=>{
    const damageBooks = await getDamageBooks()
    res.send(damageBooks)
})

app.get('/damageBooks/:studentNumber', async(req,res)=>{
    const studentNumber = parseInt(req.params.studentNumber,10)

    const isStudentNumberExist = await checkStudentNumber(studentNumber)
    if(!isStudentNumberExist) return res.status(404).json({message:`Student Number Does'nt Exist`})
    const studentNumberVerified = await checkAccountStatusByStudentNumber(studentNumber)
    if(!studentNumberVerified) return res.status(404).json({message:'Unverified Account Status!'})
    const damageBooks = await getDamageBooksByStudentNumber(studentNumber)
    res.send(damageBooks)
})

app.get('/lostBooks', async(req,res)=>{
    const lostBooks = await getLostBooks()
    res.send(lostBooks)
})

app.get('/lostBooks/:studentNumber', async(req,res)=>{
    const studentNumber = parseInt(req.params.studentNumber,10)

    const isStudentNumberExist = await checkStudentNumber(studentNumber)
    if(!isStudentNumberExist) return res.status(404).json({message:`Student Number Does'nt Exist`})
    const studentNumberVerified = await checkAccountStatusByStudentNumber(studentNumber)
    if(!studentNumberVerified) return res.status(404).json({message:'Unverified Account Status!'})
        
    const lostBooks = await getLostBooksByStudentNumber(studentNumber)
    res.send(lostBooks)
})

app.get('/pendingPenaltyBooks', async(req,res)=>{
    const pendingPenaltyBooks = await getPendingPenaltyBooks()
    res.send(pendingPenaltyBooks)
})

app.get(`/searchPenalty/:studentNumber`,async(req,res)=>{
    const studentNumber = parseInt(req.params.studentNumber,10)

    const isStudentNumberExist = await checkStudentNumber(studentNumber)
    if(!isStudentNumberExist) return res.status(404).json({message:`Student Number Does'nt Exist`})

    const studentNumberVerified = await checkAccountStatusByStudentNumber(studentNumber)
    if(!studentNumberVerified) return res.status(404).json({message:'Unverified Account Status!'})
    
    const penaltyBooks = await getPenaltyBooks(studentNumber)
    res.json(penaltyBooks)
})

app.put('/updatePendingPenalty', async(req,res)=>{
    const {bookNumber,transactionID,action,dateProcess} = req.body
    await updatePendingPenalty(transactionID,action,dateProcess)
    if(action != paid) await incrementBookStocks(bookNumber)
    res.json({message:'Action Completed'})
})

app.get('/toBuyBooks',async(req,res)=>{
    const toBuyBook = await getToBuyBooks()
    res.json(toBuyBook)
})

app.get('/toRepairBooks',async(req,res)=>{
    const toRepairBooks = await getToRepairBooks()
    res.json(toRepairBooks)
})

app.put('/settleBook',async(req,res)=>{
    const {bookNumber,transactionID,transactionStatus,dateResolved} = req.body
    await updateTransactionStatusByTransactionID(transactionStatus,dateResolved,transactionID)
    await incrementBookStocks(bookNumber)
    res.json({message:`Book succesfully ${transactionStatus}!`})
})

app.get('/searchOverdueBooksByStudentNumber/:studentNumber',async (req,res)=>{
    const studentNumber = parseInt(req.params.studentNumber, 10)

    const isStudentNumberExist = await checkStudentNumber(studentNumber)
    if(!isStudentNumberExist) return res.status(404).json({message:`Student Number Does'nt Exist`})

    const studentNumberVerified = await checkAccountStatusByStudentNumber(studentNumber)
    if(!studentNumberVerified) return res.status(404).json({message:'Unverified Account Status!'})

    const overdueBooks = await getOverDueBooks(studentNumber)
    res.json(overdueBooks)
})

app.get('/searchBook',async(req,res)=>{
    const searchInput = req.query.q
    const books = await getBooksBySearch(searchInput)
    if(books) return res.send(books)
})

app.get('/researchReferences/searchBook',async(req,res)=>{
    const searchInput = req.query.q
    const books = await  searchBookFilteredByCategory(researchReferencesBooksCategory,searchInput)
    
    if(books) return res.send(books)
})
==
app.get('/educational/searchBook',async(req,res)=>{
    const searchInput = req.query.q
    const books = await  searchBookFilteredByCategory(educationalBooksCategory,searchInput)
    if(books) return res.send(books)
})

app.get('/fiction/searchBook',async(req,res)=>{
    const searchInput = req.query.q
    const books = await  searchBookFilteredByCategory(fictionBooksCategory,searchInput)
    
    if(books) return res.send(books)
})

app.get('/generalReading/searchBook',async(req,res)=>{
    const searchInput = req.query.q
    const books = await searchBookFilteredByCategory(generalReadingBooksCategory,searchInput)
    if(books) return res.send(books)
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
