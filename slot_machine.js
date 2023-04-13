//Things that we are going to do in this project is:
// 1.Deposit the money
// 2.Determine number of lines to bet on
// 3. Collect a bet amount
// 4.Spin the slot machine
// 5. Check if the user has won or not
// 6. Give the user their winnings
// 7.Play again

// Importing the prompt-sync module to read input from user
const prompt= require("prompt-sync")();

//creating a connection with mysql database
const mysql = require("mysql2");
const connection = mysql.createConnection({
    
    connectTimeout: 500000, // in milliseconds
    host: "localhost", //mysql hostname
    user: "root",  //username
    password: "123456", //password
    database: "slot_machine", //mysql database name
});

//no of rows and columnns in the slot machine
const ROWS = 3;
const COLS = 3;

//no of symbols to be present in the machine and also the type of symbols
const SYMBOLS_COUNT = {
    "A":2,
    "B":4,
    "C":6,
    "D":8,
   
};

//cost of each symbol
const SYMBOL_VALUE = {
    "A":2,
    "B":2,
    "C":2,
    "D":2,
};

//deposit function to allow the user to deposit the money and play the game
const deposit = () => {
    while (true) {
      const depositAmt = prompt("Enter the deposit amount: ");
      const numberDepositAmt = parseFloat(depositAmt);
        
        //checking if the user has entered valid amt or not...
      if (isNaN(numberDepositAmt) || numberDepositAmt <= 0) {
        console.log("Invalid Deposit Amount, Try Again..");
      } else {
          //generating a random id for the user 
        const id = Math.floor(Math.random() * 1000);
          //inserting the id and deposit amt into the database table
        connection.query(
          `INSERT INTO slot_machine (id, deposit) VALUES (${id}, ${numberDepositAmt})`,
          (error, results) => {
            if (error) {
              console.log("Error depositing money: ", error);
            } else {
              console.log("Money deposited successfully!");
            }
          }
        );
        return { id, balance: numberDepositAmt };
      }
    }
  };


//allowing the user to ask on how many lines should the user bet on
const getNumberOfLines = () =>{
    while(true){
        const lines = prompt("Enter the no of lines to bet on(1-3): ");
        const numberOfLines = parseFloat(lines);
        
            //restricting the user to only 1-3 lines
        if(isNaN(numberOfLines) || numberOfLines <= 0 || numberOfLines > 3){
            console.log("Invalid no of lines,Try Again..");
        }
        else{
            return numberOfLines;
        }
    }
};


//allowing the user to ask the amount to be bet per each line
const getBet = (balance,lines) =>{
    while(true){
        const bet = prompt("Enter the bet per line: ");
        const numberBet = parseFloat(bet);

        //checking the bet amt is vakid or not
        if(isNaN(numberBet) || numberBet <= 0 || numberBet > balance / lines){
            console.log("Invalid Bet,Try Again..");
        }
        else{
            return numberBet;
        }
    }
};


// The function returns an array of three reels
const spin = () => {
const symbols = [];
for (const [symbol, count] of Object.entries(SYMBOLS_COUNT)) {
for (let i = 0; i < count; i++) {
symbols.push(symbol);
}
}
   
// It then creates an array of three reels where each reel contains ROWS number of symbols
    const reels =[[],[],[]];
    for(let i=0;i<COLS;i++){
        const reelSymbols = [...symbols];
        for(let j=0;j<ROWS;j++){
            const randomIndex = Math.floor(Math.random() * reelSymbols.length);
            const selectedSymbol = reelSymbols[randomIndex];
            reels[i].push(selectedSymbol);
            reelSymbols.splice(randomIndex, 1); // 1 is to remove one element
        }
    }
   
    return reels;
};

// This function transposes the reels array to rows array
const transpose = (reels) =>{
    const rows = [];
    
   // Each row contains symbols from all three reels for a specific index
    for(let i=0;i<ROWS;i++){
        rows.push([]);
        for(let j=0;j<COLS;j++){
            rows[i].push(reels[j][i])
        }
    }
   
    return rows;
};


const printRows = (rows) =>{
    for (const row of rows){
        let rowString = "";
        for(const [i,symbol] of row.entries()) {
            rowString+= symbol;
            if(i!=rowString-1){
                rowString+= " | ";
            }
        }
        console.log(rowString);
    }
};

// This function checks each row to determine if all the symbols are the same
// If all the symbols are the same, it calculates the winnings based on the bet and SYMBOL_VALUE
const getWinnings = (rows, bet, lines)=> {
    let winnings = 0;
    for (let row=0;row<lines;row++){
        const symbols = rows[row];
        let allSame=true;
       
        for(const symbol of symbols){
            if(symbol!=symbols[0]){
                allSame=false;
                break;
            }
        }
       
        if(allSame){
            winnings += bet * SYMBOL_VALUE[symbols[0]]
        }
    }
    return winnings;
};

// This is the main function that controls the game flow

const game = () => {
    let { id, balance } = deposit();
  
    while (true) {
      console.log("You have a balance of $" + balance);
      const numberOfLines = getNumberOfLines();
      const bet = getBet(balance, numberOfLines);
      balance -= bet * numberOfLines;
      const reels = spin();
      const rows = transpose(reels);
      printRows(rows);
      const winnings = getWinnings(rows, bet, numberOfLines);
      balance += winnings;
      console.log("YOU HAVE WON, $" + winnings.toString());
  
      if (balance <= 0) {
        console.log("You have ran out of money!");
        break;
      }
  
      const playAgain = prompt("Do you want to play again(y/n): ");
  
      if (playAgain != "y") {
        connection.query(
          `UPDATE slot_machine SET balance = ${balance} WHERE id = ${id}`,
          (error, results) => {
            if (error) {
              console.log("Error updating balance: ", error);
            } else {
              console.log("Balance updated successfully!");
            }
          }
        );
          // If the user chooses not to play again, the balance is updated in the database and the game ends.
        console.log("You have finally won the amount of $" + balance);
        break;
      }
    }
  };  

//calling the call function for the working of the slot machine
  game();
