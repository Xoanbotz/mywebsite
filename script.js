const greeting=document.getElementById("greeting");
const clock=document.getElementById("clock");

function updateClock(){

const now=new Date();

clock.innerHTML=now.toLocaleString();

let h=now.getHours();

if(h<12){

greeting.innerHTML="Selamat Pagi";

}else if(h<15){

greeting.innerHTML="Selamat Siang";

}else if(h<18){

greeting.innerHTML="Selamat Sore";

}else{

greeting.innerHTML="Selamat Malam";

}

}

setInterval(updateClock,1000);

updateClock();

function addTask(){

const input=document.getElementById("taskInput");

const list=document.getElementById("taskList");

if(input.value=="") return;

const li=document.createElement("li");

li.textContent="✅ "+input.value;

list.appendChild(li);

input.value="";

}

const note=document.getElementById("note");

note.value=localStorage.getItem("note")||"";

note.addEventListener("input",()=>{

localStorage.setItem("note",note.value);

});