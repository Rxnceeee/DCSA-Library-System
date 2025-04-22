import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT) || 3306
}).promise();


const verified = 'VERIFIED'
const pending  = 'PENDING'
const returned = 'RETURNED'
const lost = 'LOST'
const toClaim = 'TO CLAIM'
const expiredRequest= 'EXPIRED REQUEST'
const claimed = 'CLAIMED'
const overdue =  'OVERDUE'
const severeDamage ='SEVERE DAMAGE'
const mildDamage ='MILD DAMAGE'
const minimalDamage ='MINIMAL DAMAGE'
const paid = 'PAID'
const repaired = 'REPAIRED'
const replaced = 'REPLACED'
const unPaid = 'UNPAID'
const unRepaired = 'UNREPAIRED'
const unReplaced = 'UNREPLACED'


export async function getVerifiedStudents() {
    const sqlQuery = 'SELECT id ,studentNumber, username,dateTimeRegistered FROM studentAccount WHERE accountStatus = ?'
    const [result] = await pool.query(sqlQuery,[verified])
    return result
}

export async function getUnverifiedStudents() {
    const sqlQuery = 'SELECT id ,studentNumber, dateTimeRegistered, username FROM studentAccount WHERE accountStatus = ?';
    const [result] = await pool.query(sqlQuery, [pending]);
    return result
}
export async function checkAccountStatusByStudentNumber(studentNumber){
    const sqlQuery = 'SELECT  accountStatus FROM studentAccount WHERE studentNumber = ?';
    const [result] = await pool.query(sqlQuery,[studentNumber])
    return result[0].accountStatus === verified
}

export async function isValidAccount (username, password){
    const sqlQuery='Select COUNT(*) AS count From studentAccount WHERE BINARY username=? AND BINARY password =?';
    const [result]= await pool.query(sqlQuery,[username,password]);
    return result[0].count > 0;
}

export async function checkAccountStatusByUsername(username){
    const sqlQuery = 'SELECT  accountStatus FROM studentAccount WHERE username = ?';
    const [result] = await pool.query(sqlQuery,[username])
    return result[0].accountStatus === verified
}
export async function getStudentAccountInfo(studentNumber) {
    const sqlQuery = 'SELECT accountStatus, username, id ,studentNumber,dateTimeRegistered FROM studentAccount WHERE studentNumber = ?';
    const [result] = await pool.query(sqlQuery,[studentNumber])
    return result
}
export async function getBorrowRequestBookByStudentNumber(studentNumber){
    const sqlQuery =`   SELECT CONCAT(A.lastName, ', ',A.firstName,' ',A.middleName) as fullName, A.studentNumber,C.bookTitle,C.bookNumber,B.dateTimeBooked,b.transactionID
                        FROM studentdetails AS A 
                        JOIN booktransaction AS B 
                        ON A.studentNumber =B.studentNumber
                        JOIN bookdetails AS C 
                        ON B.bookNumber =c.bookNumber
                        WHERE A.studentNumber =?
                        AND B.transactionStatus =?`
    const [result] = await pool.query(sqlQuery,[studentNumber,toClaim])
    return result
}


export async function verifyAccountRequest(id,action){
    const sqlQuery='Update studentAccount SET accountStatus=? WHERE id=?'
    await pool.query(sqlQuery,[action,id])
    
}
export async function deleteAccountRequest(id,studentNumber){
    const sqlQueryRejectStudentAccount = 'DELETE FROM studentAccount WHERE id=?'
    const sqlQueryRejectStudentDetails = 'DELETE FROM studentDetails WHERE studentNumber=?'

    await pool.query(sqlQueryRejectStudentAccount,[id])
    await pool.query(sqlQueryRejectStudentDetails,[studentNumber])
}

export async function   getAllVerifiedStudents(){
    const sqlQuery =`SELECT a.lastName, 
                            a.firstName, 
                            a.middleName, 
                            a.studentNumber, 
                            a.yearGradeLevel, 
                            a.courseStrand 
                        FROM studentDetails AS a 
                        JOIN studentAccount AS b 
                        ON a.studentNumber = b.studentNumber 
                        WHERE b.accountStatus = ?;` 
    const [result]=await pool.query(sqlQuery,[verified])           
    return result
}

export async function getMainDashboardInfo(){
    const sqlQuery=`SELECT 
                    (SELECT COUNT(*) FROM studentAccount WHERE accountStatus = ?) AS totalVerifiedStudents,
                    (SELECT COUNT(*) FROM bookTransaction WHERE transactionStatus = ?) AS totalBorrowRequests,
                    (SELECT COUNT(*) FROM studentAccount WHERE accountStatus = ?) AS totalAccountRequests,
                    (SELECT COUNT(*) FROM bookTransaction WHERE transactionStatus IN(?,?,?)) AS totalPendingPenaltyBooks,
                    (SELECT COUNT(*) FROM bookTransaction WHERE returnCondition IN(?,?,?)) AS totalDamagedBooks,
                    (SELECT COUNT(*) FROM bookTransaction WHERE returnCondition = ?) AS totalLostBooks,
                    (SELECT COUNT(*) FROM bookTransaction WHERE transactionStatus IN(?,?)) AS totalBorrowedBooks,
                    (SELECT COUNT(*) FROM bookTransaction WHERE transactionStatus = ?) AS totalReturnedBooks,
                    (SELECT COUNT(*) FROM bookTransaction WHERE transactionStatus = ?) AS totalOverdueBooks,
                    (SELECT COUNT(*) FROM bookdetails) AS totalBooks,
                    (SELECT COUNT(*) FROM bookTransaction WHERE transactionStatus = ? AND returnCondition IN(?,?)) AS totalToBuyBooks,
                    (SELECT COUNT(*) FROM bookTransaction WHERE transactionStatus = ? AND returnCondition IN(?)) AS totalToRepairBooks,
                    (SELECT SUM(bookStocks) FROM bookdetails) + (SELECT COUNT(*) FROM bookTransaction WHERE transactionStatus IN(?,?)) as allBookStocks,
                    (SELECT SUM(bookStocks) FROM bookdetails) AS remainingBookStocks`
    const [result] = await pool.query(sqlQuery,[verified,toClaim,pending,unReplaced,unPaid,unRepaired,severeDamage,mildDamage,minimalDamage,lost,claimed,overdue,returned,overdue,paid,severeDamage,lost,paid,mildDamage,claimed,overdue])
    return result
}


export async function getReturnedBooks(){
    const sqlQuery= `   SELECT A.lastName ,A.firstName,A.middleName, C.bookTitle,B.dateTimeClaimed,B.dateTimeReturned
                        FROM studentdetails AS A JOIN booktransaction AS B ON A.studentNumber = B.studentNumber 
                        JOIN bookdetails AS C ON B.bookNumber = C.bookNumber WHERE b.transactionStatus=?`
    const [result] = await pool.query(sqlQuery,[returned])
    return result
}
export async function getBookTransactionHistory() {
    const sqlQuery =`   SELECT A.lastName, A.firstName,A.middleName, A.studentNumber, C.bookNumber,C.bookTitle,B.dateTimeBooked, B.dateTimeClaimed, B.dateToBeReturn,B.dateReported,B.datePaid,B.dateReplaced,B.dateRepaired,B.dateResolved, B.returnCondition, B.returnPenalty, B.dateTimeReturned,B.transactionStatus
                        FROM studentdetails AS A JOIN booktransaction AS B ON A.studentNumber = B.studentNumber JOIN bookdetails AS C ON B.bookNumber=C.bookNumber`
    const [result] = await pool.query(sqlQuery)
    return result
}


export async function registerStudent(studentNumber,firstName,lastName,middleName,yearGradeLevel,courseStrand,phoneNumber,emailAddress) {
    const sqlQuery='Insert Into studentDetails(studentNumber, firstName, LastName, middleName, yearGradeLevel, courseStrand, phoneNumber, emailAddress) VALUES(?,?,?,?,?,?,?,?)'
    await pool.query(sqlQuery,[studentNumber,firstName,lastName,middleName,yearGradeLevel,courseStrand,phoneNumber,emailAddress])
}

export async function checkStudentNumberInAccount(studentNumber) {
    const sqlQuery='SELECT COUNT(*) AS count FROM studentAccount WHERE BINARY studentNumber=?'
    const [result]=await pool.query(sqlQuery,[studentNumber])
    return result[0].count>0
}

export async function checkUsername(username) {
    const sqlQuery = 'SELECT * FROM studentAccount WHERE BINARY username=?';
    const [result] = await pool.query(sqlQuery, [username]);
    return result.length > 0;
}

export async function checkStudentNumber(studentNumber) {
    const sqlQuery='Select * FROM studentDetails WHERE studentNumber =?'
    const [result] = await pool.query(sqlQuery,[studentNumber])
    return result.length > 0;
}

export async function checkPhoneNumber(phoneNumber){
    const sqlQuery='Select * From studentDetails WHERE phoneNumber=?'
    const [result]= await pool.query(sqlQuery,[phoneNumber])
    return result.length > 0;
}

export async function checkEmailAddress(emailAddress){
    const sqlQuery='Select * from studentDetails WHERE emailAddress=?'
    const [result] = await pool.query(sqlQuery,[emailAddress])
    return result.length > 0;
}

export async function createAccount(studentNumber, username,password,dateTimeRegistered){
    const sqlQuery='Insert Into studentAccount (studentNumber, username, password, accountStatus,dateTimeRegistered) VALUES (?,?,?,?,?)';
    await pool.query(sqlQuery,[studentNumber,username,password,pending,dateTimeRegistered]);
}

export async function getStudents() {
    const sqlQuery=`SELECT lastName,firstName,middleName, studentNumber, courseStrand,yearGradeLevel,phoneNumber, emailAddress, studentID FROM studentDetails`
    const [students]= await pool.query(sqlQuery)
    return students
}

export async function updateStudentDetails(studentNumber, lastName,firstName,middleName, yearGradeLevel, courseStrand, phoneNumber, emailAddress,studentID){
    const sqlQuery='UPDATE studentDetails SET studentNumber=?, lastName=?,firstName=?,middleName=?, yearGradeLevel=?, courseStrand=?, phoneNumber=?, emailAddress=? WHERE studentID=?'
    const [result] = await pool.query(sqlQuery,[studentNumber, lastName,firstName,middleName, yearGradeLevel, courseStrand, phoneNumber, emailAddress,studentID])
    return result.affectedRows
}

export async function changePassword (username, newPassword){
    const sqlQuery='UPDATE studentAccount SET password=? WHERE BINARY username=?';
    const [result]= await pool.query(sqlQuery,[newPassword,username]);
    return result.affectedRows;
}

export async function isValidUsernamePasswordAdmin(username,password) {
    const sqlQuery= 'Select COUNT(*) AS count From adminAccount WHERE BINARY username=? AND BINARY password =?'
    const [result]= await pool.query(sqlQuery,[username,password]);

    return result[0].count > 0;
}

export  async function getUserInfo(username) {
    const studentNumber= await getStudentNumber(username);
   
    const sqlQuery =`
                    Select B.username, B.accountStatus, A.studentNumber, Concat(A.lastName, " ",A.firstName,' ', A.middleName) as fullName, A.yearGradeLevel, A.courseStrand, A.phoneNumber, A.emailAddress 
                    FROM studentDetails AS A JOIN studentAccount as B 
                    ON A.studentNumber = B.studentNumber 
                    WHERE A.studentNumber =?`
    const [userInfo]= await pool.query(sqlQuery,[studentNumber])
    return userInfo
}


export  async function getStudentNumber(username) {
    const sqlQuery='Select studentNumber FROM studentAccount WHERE BINARY username=?';
    const [result] = await pool.query(sqlQuery,[username]);
    return result[0].studentNumber
}

export async function getBookNumber(bookNumber) {
    const sqlQuery = 'SELECT COUNT(*) AS count FROM bookDetails WHERE bookNumber=?';
    const [result] = await pool.query(sqlQuery, [bookNumber]);

    return result[0].count > 0;
}

export async function registerBook(bookNumber,bookAuthor,bookTitle, bookCategory, bookDescription,frontCover,bookStocks) {
    const sqlQuery = 'INSERT INTO  bookDetails (bookNumber,bookAuthor,bookTitle, bookCategory, bookDescription,frontCover,bookStocks) VALUES(?,?,?,?,?,?,?)'
    await pool.query(sqlQuery,[bookNumber,bookAuthor,bookTitle, bookCategory, bookDescription,frontCover,bookStocks])
}

export async function getAllBooks() {
    const sqlQuery = 'SELECT bookID, frontCover, bookNumber,bookTitle, bookAuthor, bookCategory,bookDescription, bookStocks FROM bookDetails'
    const [result] = await pool.query(sqlQuery)
    return result;
}
export async function updateBookStocks(bookID,bookStocks) {
    const sqlQuery ='UPDATE bookDetails SET bookStocks = ? WHERE bookID=?'
    const [result] = await pool.query(sqlQuery,[bookStocks,bookID])
    return result.affectedRows
    
}
export async function getBooksByCategoryLimit10(bookCategory) {
    const sqlQuery= `SELECT bookID, bookTitle, bookAuthor, bookDescription, frontCover, bookStocks, bookNumber FROM bookDetails WHERE bookStocks > 0 AND bookCategory =? limit 10`
    const [result]=await pool.query(sqlQuery,[bookCategory])
    return result
}

export async function getBooksByCategory(bookCategory) {
    const sqlQuery= 'SELECT bookID, bookTitle, bookAuthor, bookDescription, frontCover, bookStocks, bookNumber FROM bookDetails WHERE bookCategory =? ORDER BY bookStocks DESC'
    const [result]=await pool.query(sqlQuery,[bookCategory])
    return result
}

export async function borrowCount(studentNumber) {
    const sqlQuery=`SELECT COUNT(*) AS count  FROM bookTransaction WHERE studentNumber=? AND transactionStatus IN('TO CLAIM','CLAIMED','OVERDUE')`
    const [result] = await pool.query(sqlQuery,[studentNumber])
    return result[0].count
}
export async function getStudentUnpaidPenaltyCount(studentNumber){
    const sqlQuery = `  SELECT  COUNT(*) AS pendingPenalty
                        FROM booktransaction WHERE studentNumber =? AND transactionStatus ='UNPAID'`
    const [result] = await pool.query(sqlQuery,[studentNumber])
    return result[0].pendingPenalty
}
export async function getStudentUnrepairedPenaltyCount(studentNumber){
    const sqlQuery = `  SELECT  COUNT(*) AS pendingPenalty
                        FROM booktransaction WHERE studentNumber =? AND transactionStatus ='UNREPAIRED'`
    const [result] = await pool.query(sqlQuery,[studentNumber])
    return result[0].pendingPenalty
    
}
export async function getStudentUnreplacedPenaltyCount(studentNumber){
    const sqlQuery = `  SELECT  COUNT(*) AS pendingPenalty
                        FROM booktransaction WHERE studentNumber =? AND transactionStatus ='UNREPLACED'`
    const [result] = await pool.query(sqlQuery,[studentNumber])
    return result[0].pendingPenalty
}

export async function getOverDueBooks(studentNumber) {
    const sqlQuery=`SELECT A.bookTitle, B.dateTimeClaimed, B.dateToBeReturn,B.transactionID, B.transactionStatus,CONCAT(C.lastName,', ',C.firstName,' ',C.middleName) AS fullName, C.studentNumber, A.bookNumber,C.phoneNumber, C.emailAddress
                    FROM bookdetails AS A JOIN booktransaction as B
                    ON A.bookNumber = B.bookNumber
                    JOIN studentdetails AS C 
                    ON C.studentNumber =B.studentNumber
                    WHERE B.studentNumber =? AND B.transactionStatus=?`
    const [result]= await pool.query(sqlQuery,[studentNumber,overdue])
    return result
}

export async function getPenaltyBooks(studentNumber) {
    const sqlQuery=`SELECT A.bookTitle, B.dateTimeClaimed, B.dateToBeReturn,B.transactionID, B.transactionStatus,CONCAT(C.lastName,', ',C.firstName,' ',C.middleName) AS fullName, C.studentNumber, A.bookNumber
                    FROM bookdetails AS A JOIN booktransaction as B
                    ON A.bookNumber = B.bookNumber
                    JOIN studentdetails AS C 
                    ON C.studentNumber =B.studentNumber
                    WHERE B.studentNumber =? AND B.transactionStatus IN(?,?,?)`
    const [result]= await pool.query(sqlQuery,[studentNumber,unPaid,unRepaired,unReplaced])
    return result
}

export async function updateTransactionStatus(currentDate) {
    const sqlQuery = 'UPDATE bookTransaction SET transactionStatus =? WHERE dateToBeReturn < ? AND transactionStatus=?'
    const [result]= await pool.query(sqlQuery,[overdue,currentDate,claimed])
}

export async function expireBorrowRequest(currentDateTime) {
    const sqlQuery =`   UPDATE booktransaction set transactionStatus =? 
                        WHERE TIMESTAMPDIFF(HOUR,dateTimeBooked,?) > 24 AND 
                        transactionStatus =?`  
    const [result]= await pool.query(sqlQuery,[expiredRequest,currentDateTime,toClaim]) 
}



export async function borrowBook(bookNumber,studentNumber,dateTimeBooked){
    const sqlQuery = 'Insert INTO bookTransaction (bookNumber,studentNumber,dateTimeBooked) VALUES (?,?,?)'
    const result = await pool.query(sqlQuery,[bookNumber,studentNumber,dateTimeBooked])
    return result[0].affectedRows
}
export async function decrementBookStocks(bookNumber){

    const sqlQuery = 'Update bookDetails SET bookStocks = bookStocks-1 WHERE bookNumber =?'
    const [result] = await pool.query(sqlQuery,[bookNumber])
    return result.affectedRows
}
export async function incrementBookStocks(bookNumber){
    const sqlQuery = 'Update bookDetails SET bookStocks = bookStocks+1 WHERE bookNumber =?'
    const [result] = await pool.query(sqlQuery,[bookNumber])
    return result.affectedRows
}

export async function getBookRequest() {
    const sqlQuery = `  Select B.transactionID,CONCAT(C.lastName,", ",C.firstName," ",C.middleName) AS fullName, B.studentNumber,A.bookTitle, B.bookNumber, B.dateTimeBooked
                        FROM bookDetails AS A JOIN booktransaction AS B ON A.bookNumber = B.bookNumber JOIN studentdetails as C ON B.studentNumber = C.studentNumber
                        WHERE B.transactionStatus =?`
    const [borrowRequest] = await pool.query(sqlQuery,[toClaim])
   return borrowRequest
}

export async function rejectBookRequest(transactionID,action){
    const sqlQuery='UPDATE bookTransaction SET transactionStatus=? WHERE transactionID=?'
    pool.query(sqlQuery,[action,transactionID])
}
export async function approveBookRequest(transactionID,action,dateTimeClaimed,dateToBeReturn){
    const sqlQuery='UPDATE bookTransaction SET transactionStatus=?, dateTimeClaimed=?,dateToBeReturn=?  WHERE transactionID=?'
    pool.query(sqlQuery,[action, dateTimeClaimed,dateToBeReturn,transactionID])
}
export async function getBorrowedBooks(){
    const sqlQuery = `  Select B.transactionID,CONCAT(C.lastName,", ",C.firstName," ",C.middleName) AS  fullName, B.dateToBeReturn,  B.studentNumber,A.bookTitle, B.bookNumber, B.dateTimeClaimed
                        FROM bookDetails AS A JOIN booktransaction AS B ON A.bookNumber = B.bookNumber JOIN studentdetails as C ON B.studentNumber = C.studentNumber
                        WHERE B.transactionStatus =?`
    const [borrowedBooks]= await pool.query(sqlQuery,[claimed])
    return borrowedBooks
}

export async function searchBorrowedBooksByStudentNumber(studentNumber) {
    const sqlQuery = `  Select B.transactionID,CONCAT(C.lastName,", ",C.firstName," ",C.middleName) AS  fullName, B.dateToBeReturn,  B.studentNumber,A.bookTitle, B.bookNumber, B.dateTimeClaimed
                        FROM bookDetails AS A JOIN booktransaction AS B ON A.bookNumber = B.bookNumber JOIN studentdetails as C ON B.studentNumber = C.studentNumber
                        WHERE B.transactionStatus =? AND C.studentNumber =?`
    const [borrowedBooks]= await pool.query(sqlQuery,[claimed,studentNumber])
    return borrowedBooks
}
export async function getBookTransactionStatus(transactionID){
    const sqlQuery = `SELECT transactionStatus FROM bookTransaction WHERE transactionID=?`
    const [result] = await pool.query(sqlQuery,[transactionID])
    return result
}

export async function returnBook(transactionID,dateTimeReturned,returnCondition){
    const sqlQuery=`UPDATE bookTransaction SET dateTimeReturned=?, returnCondition=?, returnPenalty='NONE' , transactionStatus=? WHERE transactionID=?`
    const result =await pool.query(sqlQuery,[dateTimeReturned,returnCondition,returned,transactionID])
    return result[0].affectedRows
}
export async function returnBookAsLost(transactionID,dateReported,returnCondition,returnPenalty,transactionStatus){
    const datePaid = transactionStatus == paid ? dateReported:null
    const dateReplaced = transactionStatus == replaced ? dateReported :null
    const sqlQuery='UPDATE bookTransaction SET dateReported=?, returnCondition=?, returnPenalty=?,datePaid=?,dateReplaced=?,  transactionStatus=? WHERE transactionID=?'

    const result =await pool.query(sqlQuery,[dateReported,returnCondition,returnPenalty,datePaid,dateReplaced,transactionStatus,transactionID])
    return result[0].affectedRows
}

export async function returnBookAsDamage(transactionID,dateReported,returnCondition,returnPenalty,transactionStatus){
    const datePaid = transactionStatus == paid ? dateReported: null
    const dateReplaced = transactionStatus == replaced ? dateReported :null
    const dateRepaired = transactionStatus == repaired ? dateReported :null
    const sqlQuery='UPDATE bookTransaction SET dateReported=?, returnCondition=?, returnPenalty=?, datePaid=?,dateReplaced=?,dateRepaired=?, transactionStatus=? WHERE transactionID=?'
    const result =await pool.query(sqlQuery,[dateReported,returnCondition,returnPenalty,datePaid,dateReplaced,dateRepaired,transactionStatus,transactionID])
    return result[0].affectedRows
}

export async function returnBookAsMinimalDamage(transactionID,dateReported,dateTimeReturned,returnCondition,returnPenalty) {
    const sqlQuery = `UPDATE bookTransaction SET dateTimeReturned=?,dateReported=?, returnCondition=?, returnPenalty=?, transactionStatus=? WHERE transactionID=?`
    const result =await pool.query(sqlQuery,[dateTimeReturned,dateReported,returnCondition,returnPenalty,returned,transactionID])
    return result[0].affectedRows
}

export async function getAllOverDueBooks(){
    const sqlQuery = `SELECT A.phoneNumber,A.emailAddress, A.lastName,A.firstName,A.middleName,A.studentNumber, C.bookNumber, C.bookTitle,B.transactionID, B.dateTimeClaimed,B.dateToBeReturn,B.transactionStatus
                      FROM studentdetails AS A  JOIN booktransaction AS B ON A.studentNumber = B.studentNumber 
                      JOIN bookdetails AS C ON B.bookNumber = C.bookNumber WHERE transactionStatus =?`
    const [result] = await pool.query(sqlQuery,[overdue])
    return result
}

export async function getStudentBookHistory(studentNumber) {
    const sqlQuery=`
                    SELECT B.bookNumber, A.bookTitle, B.dateTimeBooked, B.dateTimeClaimed, B.dateToBeReturn, B.dateTimeReturned,B.returnCondition,B.datePaid,B.dateReplaced,B.dateRepaired,B.returnPenalty,b.dateResolved, B.transactionStatus
                    FROM bookdetails AS A JOIN booktransaction AS B ON B.bookNumber = A.bookNumber WHERE B.studentNumber =?`
    const [studentBookHistory] = await pool.query(sqlQuery,[studentNumber])
    return studentBookHistory
}

export  async function getPersonalDetails(studentNumber) {
    const sqlQuery =`
            SELECT b.username, CONCAT(A.lastName, ', ', A.firstName, ' ', A.middleName) AS fullName,
            A.courseStrand, A.yearGradeLevel, A.emailAddress, A.phoneNumber,B.dateTimeRegistered, B.accountStatus 
            FROM studentDetails AS A 
            JOIN studentAccount AS B ON A.studentNumber = B.studentNumber 
            WHERE A.studentNumber =?`
    const [userInfo]= await pool.query(sqlQuery,[studentNumber])
    return userInfo
}

export async function getStudentPenalty(studentNumber) {
    const sqlQuery = `  SELECT COUNT(*) AS penaltyCount
                        FROM studentdetails AS A
                        JOIN booktransaction AS B 
                        ON A.studentNumber = B.studentNumber
                        WHERE A.studentNumber =?
                        AND B.transactionStatus IN (?,?,?);`
    const [result] = await pool.query(sqlQuery,[studentNumber,unPaid,unRepaired,unReplaced])
    return result
}
export async function getStudentOverdue(studentNumber) {
    const sqlQuery = `  SELECT COUNT(*) AS overdueCount
                        FROM studentdetails AS A
                        JOIN booktransaction AS B 
                        ON A.studentNumber = B.studentNumber
                        WHERE A.studentNumber =?
                        AND B.transactionStatus=?`
    const [result] = await pool.query(sqlQuery,[studentNumber,overdue])
    return result
}



export async function getLostBooks() {
    const sqlQuery = `  SELECT  A.studentNumber, CONCAT(A.lastName, ', ',A.firstName, ' ',a.middleName ) AS fullName, A.studentNumber, C.bookTitle, C.bookNumber,B.dateTimeClaimed, B.dateReported, B.returnCondition, B.returnPenalty,b.datePaid, b.dateReplaced, B.dateResolved, B.transactionStatus
                        FROM studentdetails AS A
                        JOIN booktransaction AS B 
                        ON A.studentNumber = B.studentNumber
                        JOIN bookdetails AS C 
                        ON B.bookNumber = C.bookNumber
                        WHERE returnCondition =?`
    const [result] = await pool.query(sqlQuery,[lost]) 
    return result
}

export async function getDamageBooks() {
    const sqlQuery = `  SELECT  A.studentNumber, CONCAT(A.lastName, ', ',A.firstName, ' ',a.middleName ) AS fullName, C.bookTitle,C.bookNumber, B.dateTimeBooked,B.dateTimeClaimed,B.dateReported, B.dateResolved, B.transactionStatus,B.returnCondition, B.returnPenalty,b.datePaid, b.dateRepaired, b.dateReplaced
                        FROM studentdetails AS A
                        JOIN booktransaction AS B 
                        ON A.studentNumber = B.studentNumber
                        JOIN bookdetails AS C 
                        ON B.bookNumber = C.bookNumber
                        WHERE B.returnCondition IN(?,?,?)`

    const [result] = await pool.query(sqlQuery,[severeDamage,mildDamage,minimalDamage]) 
    return result
}

export async function getDamageBooksByStudentNumber(studentNumber){
    const sqlQuery = `  SELECT  A.studentNumber, CONCAT(A.lastName, ', ',A.firstName, ' ',a.middleName ) AS fullName, C.bookTitle,C.bookNumber, B.dateTimeBooked,B.dateTimeClaimed,B.dateReported, B.dateResolved, B.transactionStatus,B.returnCondition, B.returnPenalty,b.datePaid, b.dateRepaired, b.dateReplaced
                        FROM studentdetails AS A
                        JOIN booktransaction AS B 
                        ON A.studentNumber = B.studentNumber
                        JOIN bookdetails AS C 
                        ON B.bookNumber = C.bookNumber
                        WHERE A.studentNumber=? AND B.returnCondition IN(?,?,?)`

    const [result] = await pool.query(sqlQuery,[studentNumber,severeDamage,mildDamage,minimalDamage]) 
    return result
}

export async function getLostBooksByStudentNumber(studentNumber){
    const sqlQuery = `  SELECT  A.studentNumber, CONCAT(A.lastName, ', ',A.firstName, ' ',a.middleName ) AS fullName, C.bookTitle,C.bookNumber, B.dateTimeBooked,B.dateTimeClaimed,B.dateReported, B.dateResolved, B.transactionStatus,B.returnCondition, B.returnPenalty,b.datePaid, b.dateRepaired, b.dateReplaced
                        FROM studentdetails AS A
                        JOIN booktransaction AS B 
                        ON A.studentNumber = B.studentNumber
                        JOIN bookdetails AS C 
                        ON B.bookNumber = C.bookNumber
                        WHERE A.studentNumber=? AND B.returnCondition =?`

    const [result] = await pool.query(sqlQuery,[studentNumber,lost]) 
    return result
}

export async function getBookDetails(bookNumber) {
    const sqlQuery = `  SELECT bookTitle, bookAuthor, bookCategory, bookStocks 
                        FROM bookdetails WHERE bookNumber =?`
    const [bookInfo] = await pool.query(sqlQuery,[bookNumber])
    return bookInfo

}
export async function getBookTransactions(bookNumber) {
    const sqlQuery = `  SELECT CONCAT(A.lastName,', ' ,A.firstName,' ',A.middleName) AS fullName, A.studentNumber, B.dateTimeBooked, B.dateTimeClaimed, b.dateToBeReturn, b.dateTimeReturned,b.returnCondition,b.returnPenalty,b.datePaid, b.dateRepaired, b.dateReplaced,b.dateResolved, b.transactionStatus
                        FROM studentdetails AS A
                        JOIN  booktransaction AS B ON
                        A.studentNumber = B.studentNumber
                        WHERE B.bookNumber = ?`
    const [bookTransactions] = await pool.query(sqlQuery,[bookNumber])
    return bookTransactions
}

export async function getPendingPenaltyBooks() {
    const sqlQuery = `  SELECT CONCAT(A.lastName,', ',A.firstName,' ',A.middleName) AS fullName, A.studentNumber, C.bookTitle, C.bookNumber,B.transactionID, B.dateReported, B.returnCondition, B.returnPenalty, B.transactionStatus
                        FROM studentdetails as A 
                        JOIN booktransaction as B 
                        ON A.studentNumber = B.studentNumber 
                        JOIN bookdetails AS C 
                        ON B.bookNumber = C.bookNumber 
                        WHERE B.transactionStatus IN(?,?,?)`

    const [result] = await pool.query(sqlQuery,[unReplaced,unPaid,unRepaired])
    return result
}
export async function updatePendingPenalty(transactionID,action,dateProcess){
    const datePaid = action == 'PAID' ? dateProcess:null
    const dateReplaced = action == 'REPLACED' ? dateProcess:null
    const dateRepaired = action == 'REPAIRED' ? dateProcess:null
    const sqlQuery = `UPDATE bookTransaction SET transactionStatus = ? ,datePaid=?, dateReplaced=?, dateRepaired=? WHERE transactionID=?`
    const [result] = await pool.query(sqlQuery,[action,datePaid,dateReplaced,dateRepaired, transactionID])
    return result.affectedRows
}

export async function getToBuyBooks() {
    const sqlQuery=`    SELECT COUNT(*) as bookQuantity, B.bookTitle,B.bookAuthor,B.bookNumber,A.transactionID
                        FROM booktransaction as a 
                        join bookdetails as b 
                        on a.bookNumber = b.bookNumber
                        WHERE a.transactionStatus=? AND returnCondition IN(?,?)
                        GROUP BY A.bookNumber
                        `
    const [result] = await pool.query(sqlQuery,[paid,lost,severeDamage])
    return result
}

export async function getToRepairBooks() {
    const sqlQuery=`    SELECT COUNT(*) as bookQuantity, B.bookTitle,B.bookAuthor,B.bookNumber,A.transactionID
                        FROM booktransaction as A
                        join bookdetails as B 
                        on A.bookNumber = B.bookNumber
                        WHERE A.transactionStatus=? AND A.returnCondition =?
                        GROUP BY A.bookNumber
                        `
    const [result] = await pool.query(sqlQuery,[paid,mildDamage])
    return result
}

export async function updateTransactionStatusByTransactionID(transactionStatus,dateResolved,transactionID) {
    const sqlQuery=`UPDATE bookTransaction SET transactionStatus =? ,dateResolved=? WHERE transactionID=?` 
    const [result]= await pool.query(sqlQuery,[transactionStatus,dateResolved,transactionID])
    return result.affectedRows
}

export async function getBooksBySearch(searchInput) {
   
    const searchWord = `%${searchInput}%`
    const sqlQuery = `  SELECT * FROM bookDetails 
                        WHERE bookTitle LIKE ? 
                        OR bookDescription LIKE ? 
                        OR bookCategory LIKE ? 
                        OR bookAuthor LIKE ?`
    const [result] = await pool.query(sqlQuery, [searchWord, searchWord,searchWord, searchWord])
    return result
}

export async function searchBookFilteredByCategory(category,searchInput) {
    const searchWord = `%${searchInput}%`
    const sqlQuery = `  SELECT * FROM bookDetails 
                        WHERE bookCategory =? 
                        AND (bookTitle LIKE ? 
                        OR bookDescription LIKE ? 
                        OR bookCategory LIKE ?
                        OR bookAuthor LIKE ?)
    `
    const [result] = await pool.query(sqlQuery, [category,searchWord,searchWord, searchWord, searchWord]);
    return result
}