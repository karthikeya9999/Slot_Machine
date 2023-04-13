const prompt= require("prompt-sync")();

const mysql = require("mysql2");
const connection = mysql.createConnection({
    
        connectTimeout: 500000, // in milliseconds
    host: "localhost",
    user: "root",
    password: "123456",
    database: "slot_machine",
});


const ROWS = 3;
const COLS = 3;

const SYMBOLS_COUNT = {
    "A":2,
    "B":4,
    "C":6,
    "D":8,
   
};

const SYMBOL_VALUE = {
    "A":2,
    "B":2,
    "C":2,
    "D":2,
};

const deposit = () => {
    while (true) {
      const depositAmt = prompt("Enter the deposit amount: ");
      const numberDepositAmt = parseFloat(depositAmt);
        
      if (isNaN(numberDepositAmt) || numberDepositAmt <= 0) {
        console.log("Invalid Deposit Amount, Try Again..");
      } else {
        const id = Math.floor(Math.random() * 1000);
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

const getNumberOfLines = () =>{
    while(true){
        const lines = prompt("Enter the no of lines to bet on(1-3): ");
        const numberOfLines = parseFloat(lines);

        if(isNaN(numberOfLines) || numberOfLines <= 0 || numberOfLines > 3){
            console.log("Invalid no of lines,Try Again..");
        }
        else{
            return numberOfLines;
        }
    }
};

const getBet = (balance,lines) =>{
    while(true){
        const bet = prompt("Enter the bet per line: ");
        const numberBet = parseFloat(bet);

        if(isNaN(numberBet) || numberBet <= 0 || numberBet > balance / lines){
            console.log("Invalid Bet,Try Again..");
        }
        else{
            return numberBet;
        }
    }
};

const spin = () =>{
    const symbols = [];
    for(const[symbol,count] of Object.entries(SYMBOLS_COUNT)) {
        for( let i=0;i< count; i++){
            symbols.push(symbol);
        }
    }
   
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

const transpose = (reels) =>{
    const rows = [];
   
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
        console.log("You have finally won the amount of $" + balance);
        break;
      }
    }
  };  
  game();