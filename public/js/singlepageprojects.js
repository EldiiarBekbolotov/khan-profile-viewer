const hardCodedClassifications = {};
let username = '';
function setupProfile(ur) {
  if (ur) {
    username = ur;
    document.getElementById('throw').style.display = 'none';
    initialize("ok");
  } else {
    const inputUsername = document.getElementById('userprompt').value.trim();
    if (inputUsername === '') {
      alert('Please enter a username to continue.');
      document.getElementById('throw').style.display = 'block';
      return;
    } else {
      username = inputUsername;
      document.getElementById('throw').style.display = 'none';
      initialize("ok");
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const extractedUsername = urlParams.get('user');
  
  if (extractedUsername && extractedUsername.trim() !== "") {
    setupProfile(extractedUsername);
  }
});

document.getElementById('currentYear').innerText = (new Date().getFullYear()) == 2025 ? '' : '- ' + new Date().getFullYear();
let programDetails = [];
let filteredPrograms = [];
var hotReload = !true;
function hideNavbarOnScroll(navbarIndex = 0, navbarHeight = 70) {
  let lastScroll = 0;
  const navbars = document.querySelectorAll('.navbar-fixed');
  if (navbarIndex >= navbars.length || navbarIndex < 0) {
    console.error('Invalid navbar index');
    return;
  }
  let timeoutId;
  const navbar = navbars[navbarIndex];
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll <= navbarHeight) {
      navbar.classList.remove('hide');
      return;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (currentScroll > lastScroll && !navbar.classList.contains('hide')) {
      // Scrolling down, hide the navbar

      navbar.classList.add('hide');

    } else if (currentScroll < lastScroll && navbar.classList.contains('hide')) {
      // Scrolling up, show the navbar
      timeoutId = setTimeout(() => {
        navbar.classList.remove('hide');
      }, 50);
    }

    lastScroll = currentScroll;
  });
}




hideNavbarOnScroll(0, 70);
function toggleHotReload() {
  if (hotReload === true) {
    hotReload = false;
    document.getElementById('hotReloadIndicator').innerHTML = '<span class="material-symbols-rounded">flash_on</span> Enable Hot Reload';
    initialize("ok");
  }
  else {
    hotReload = true;
    document.getElementById('hotReloadIndicator').innerHTML = '<span class="material-symbols-rounded">flash_off</span> Disable Hot Reload';
    initialize("ok");
  }
}
toggleHotReload();
function toggleNav() {
  document.getElementById("sidenav").classList.toggle("on");
  document.getElementById("overlay").classList.toggle("on");
}
function scene(index) {
  const scenes = document.querySelectorAll(".scene");
  const navSelectors = document.querySelectorAll(".navselector");

  // Scroll to top
  window.scrollTo({
    top: 0,
    left: 0,
    /*behavior: "smooth",*/
  });

  // Update visibility and animations
  scenes.forEach((scene, i) => {
    scene.style.display = i === index ? "block" : "none";
    scene.style.animation = index !== 0 ? "1s fadeIn forwards" : "";
  });

  // Update nav link decoration
  navSelectors.forEach((nav, i) => {
    nav.classList.toggle("active", i === index);
  });
  document.querySelectorAll(".mobile-navlink").forEach((navMobil, i) => {
    navMobil.classList.toggle("active", i === index);
  });
}
function openPopup(index, type) {
  /*document.querySelectorAll(".popup").forEach((popup, index) => {
  popup.style.display = 'none';
  });*/
  if (type === "close") {

    document.getElementsByClassName("popup")[index].style.animation =
      "0.1s slideOut forwards";
  } else if (type === 'hide') {
    document.getElementsByClassName("popup")[index].style.display = 'none';
    document.getElementsByClassName("popup")[index].style.animation =
      "0.1s slideOut forwards";
  } else {
    document.getElementsByClassName("popup")[index].style.display = 'block';
    document.getElementsByClassName("popup")[index].style.animation =
      "0.6s slideIn forwards";
  }
}
openPopup(0, 'hide');
async function fetchProgramDetails() {
  document.getElementById("loading").style.display = "block";
  try {
    const client = new KhanAPI.Client();
    const programs = await client.getAllUserPrograms(username);

    return programs.map((program) => ({
      id: program.id,
      title: program.rawData.translatedTitle,
      width: program.rawData.width,
      height: program.rawData.height,
      votes: program.votes,
      spinOffCount: program.spinOffCount,
      classification: hardCodedClassifications[program.id] || 0,
      /*src: `https://www.khanacademy.org/computer-programming/i/${program.id}/${program.thumbnailID}.png`,*/
      thumbnailID: program.thumbnailID,
      type: "ace/mode/html",
    }));
  } catch (error) {
    //console.error(error);
    return [];
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

async function fetchProgramCode(programId) {
  try {
    document.getElementById("loading").style.display = "block";

    const client = new KhanAPI.Client();
    const program = await client.getProgram(programId);
    return program.code;
  } catch (error) {
    //console.error(error);
    return null;
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

async function fetchProgramLanguage(programId) {
  try {
    const client = new KhanAPI.Client();
    const program = await client.getProgram(programId);
    return program.rawData.userAuthoredContentType;
  } catch (error) {
    //console.error(error);
    return null;
  }
}

async function fetchProgramWidth(programId) {
  try {
    const client = new KhanAPI.Client();
    const program = await client.getProgram(programId);
    return program.width;
  } catch (error) {
    //console.error(error);
    return null;
  }
}
async function fetchProgramHeight(programId) {
  try {
    const client = new KhanAPI.Client();
    const program = await client.getProgram(programId);
    return program.height;
  } catch (error) {
    //console.error(error);
    return null;
  }
}

async function fetchProgramStats(programId) {
  try {
    document.getElementById(
      "comments"
    ).innerHTML = `Loading program comments..`;
    document.getElementById(
      "questions"
    ).innerHTML = `Loading program questions..`;
    document.getElementById(
      "stats"
    ).innerHTML = `Loading program statistics...`;

    const client = new KhanAPI.Client();
    const program = await client.getProgram(programId);

    let allTipsAndThanks = [];
    try {
      for await (const tipsAndThanksBatch of program.getTipsAndThanks?.() ||
        []) {
        allTipsAndThanks = allTipsAndThanks.concat(
          tipsAndThanksBatch || []
        );
      }
    } catch (error) {
      allTipsAndThanks = [];
    }

    let allQuestions = [];
    try {
      for await (const questionsBatch of program.getQuestions?.() || []) {
        allQuestions = allQuestions.concat(questionsBatch || []);
      }
    } catch (error) {
      allQuestions = [];
    }

    return {
      votes: program.votes || 0,
      lines: program.lines || 0,
      created: program.created || null,
      updated: program.updated || null,
      type: program.rawData.userAuthoredContentType,
      url: program.url || "",
      tipsAndThanks: allTipsAndThanks,
      replyCount: allTipsAndThanks.length || 0,
      questions: allQuestions,
      questionCount: allQuestions.length || 0,
    };
  } catch (error) {
    //console.error(error);
    return null;
  } finally {
    document.getElementById("comments").innerHTML = ``;
    document.getElementById("questions").innerHTML = ``;
  }
}
const code1 = `<!DOCTYPE html>
<html>

<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>My Web Playground</title>
</head>

<body>

</body>

</html>`;
async function setupEditor(programIndex) {
  if (programIndex === 'html_demo') {

    const editor1 = ace.edit("editor");

    const width1 = 600;
    const height1 = 600;
    editor1.setValue(code1, -1);
    if (window.innerWidth >= 900) {
      document.getElementById("editor").style.minHeight = `${height1}px`;
    } else {
      document.getElementById("editor").style.minHeight = `50vh`;
    }
    //if (hotReload === true) {
    editor1.getSession().on("change", function () {
      update(editor1.getValue(), width1, height1, 'ace/mode/html', true);
    });
    //}
    editor1.setTheme("ace/theme/tomorrow_night");
    editor1.getSession().setMode('ace/mode/html');
    editor1.session.setUseWrapMode(true);
    editor1.setOptions({
      fontSize: "11pt",
      showLineNumbers: true,
      showGutter: true,
      vScrollBarAlwaysVisible: true,
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true,
    });
    editor1.setShowPrintMargin(false);
    editor1.setBehavioursEnabled(false);
    editor1.commands.addCommand({
      name: "myCommand",
      bindKey: {
        win: "Ctrl-Enter",
        mac: "Command-Enter",
      },
      exec: function (editor1) {
        runCode();
      },
      readOnly: true, // false if this command should not apply in readOnly mode
      // multiSelectAction: "forEach", optional way to control behavior with multiple cursors
      // scrollIntoView: "cursor", control how cursor is scolled into view after the command
    });

    update(code1, width1, height1, 'ace/mode/html', true); document.getElementById("comments").innerHTML = `<div class='comment'>
<h2 class='center'>No comments yet.</h2>

</div>`; document.getElementById(
      "questions"
    ).innerHTML = `<div class='comment'>
<h2 class='center'>No questions yet.</h2>

</div>`;
  } else {
    const editor = ace.edit("editor");
    const selectedProgram = filteredPrograms[programIndex];
    const code = await fetchProgramCode(selectedProgram.id);
    const language = await fetchProgramLanguage(selectedProgram.id);

    if (language === "PJS") {
      var width = await fetchProgramWidth(selectedProgram.id);

      //if (window.innerWidth >= 901) {
      // document.getElementById('editor').style.minWidth = `calc(100%-${width}px)`;
      //}
    } else {
      var width = 600;
    }

    var height = await fetchProgramHeight(selectedProgram.id);
    editor.setValue(code, -1);
    if (window.innerWidth >= 900) {
      document.getElementById("editor").style.minHeight = `${height}px`;
    } else {
      document.getElementById("editor").style.minHeight = `50vh`;
    }
    let aceMode;
    if (language === "PJS") {
      aceMode = "ace/mode/javascript";
      selectedProgram.type = aceMode;
    }
    if (language === "WEBPAGE") {
      aceMode = "ace/mode/html";
      selectedProgram.type = aceMode;
    }
    if (language === "SQL") {
      aceMode = "ace/mode/sql";
      selectedProgram.type = aceMode;
    }
    if (language === "PYTHON") {
      aceMode = "ace/mode/python";
      selectedProgram.type = aceMode;
    }

    if (hotReload === true) {
      editor.getSession().on("change", function () {
        update(editor.getValue(), width, height, aceMode, false);
      });
    }
    //ace.require("ace/ext/language_tools");
    editor.setTheme("ace/theme/tomorrow_night");
    editor.getSession().setMode(aceMode);
    editor.session.setUseWrapMode(true);
    editor.setOptions({
      fontSize: "11pt",
      showLineNumbers: true,
      showGutter: true,
      vScrollBarAlwaysVisible: true,
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true,
    });
    editor.setShowPrintMargin(false);
    editor.setBehavioursEnabled(false);
    editor.commands.addCommand({
      name: "myCommand",
      bindKey: {
        win: "Ctrl-Enter",
        mac: "Command-Enter",
      },
      exec: function (editor) {
        runCode();
      },
      readOnly: true, // false if this command should not apply in readOnly mode
      // multiSelectAction: "forEach", optional way to control behavior with multiple cursors
      // scrollIntoView: "cursor", control how cursor is scolled into view after the command
    });

    update(code, width, height, aceMode, false);
    /*filteredPrograms[
    document
      .querySelector(".programSelector.active")
      ?.getAttribute("data-index")
  ].type = aceMode;*/
    const stats = await fetchProgramStats(selectedProgram.id);
    //console.log(stats.tipsAndThanks);
    document.getElementById("stats").innerHTML = `
          <ul>
             
<li><span class="material-symbols-rounded">favorite</span> ${stats.votes} Votes</li>
<li><span class="material-symbols-rounded">code</span> ${stats.lines} Lines of code</li>
<li> <span class="material-symbols-rounded">forum</span> ${stats.replyCount} Comments</li>
             <li> <span class="material-symbols-rounded">contact_support</span> ${stats.questionCount} Questions</li>
<li><span class="material-symbols-rounded">calendar_month</span> Created ${stats.created}</li>
<li><span class="material-symbols-rounded">history</span> Updated ${stats.updated}</li>
<li><span class="material-symbols-rounded">language</span> Type: ${language}</li>
<li>Code license: <a href='https://opensource.org/license/mit' target='_blank'>MIT</a>. For more information, <span class="material-symbols-rounded">open_in_new</span> <a href=${stats.url} target='_blank'>Visit on Khan Academy</a></li>
</ul>
`;

    if (stats.tipsAndThanks && stats.tipsAndThanks.length >= 1) {
      let tipsAndThanksHTML = "";
      for (const tipAndThank of stats.tipsAndThanks) {
        if (
          tipAndThank &&
          tipAndThank.rawData &&
          tipAndThank.rawData.content
        ) {
          const commentDiv = document.createElement("div");
          commentDiv.className = "comment";

          commentDiv.innerHTML += `<h2><a href='https://www.khanacademy.org/profile/${tipAndThank.author.kaid}' target='_blank'>${tipAndThank.author.nickname}</a></h2><p>${tipAndThank.created}</p>`;
          //console.log(tipAndThank);

          const pElement = document.createElement("p");
          pElement.textContent = tipAndThank.text;
          commentDiv.appendChild(pElement);
          commentDiv.innerHTML += `<div><a href='#!'  class='thumbtn'><span class="material-symbols-rounded">thumb_up</span> ${tipAndThank.votes}</a> <a href='https://www.khanacademy.org/computer-programming/i/${selectedProgram.id}?qa_expand_key=${tipAndThank.key}&qa_expand_type=comment' target='_blank' class='thumbtn'><span class="material-symbols-rounded">comment</span> ${tipAndThank.replyCount}</a></div>`;
          tipsAndThanksHTML += commentDiv.innerHTML;
        }
      }
      document.getElementById("comments").innerHTML += tipsAndThanksHTML;
    } else if (stats.tipsAndThanks.length === 0) {
      document.getElementById("comments").innerHTML = `<div class='comment'>
    <h2 class='center'>No comments yet.</h2>

    </div>`;
    }
    if (stats.questions && stats.questions.length >= 1) {
      let questionsHTML = "";
      for (const qs of stats.questions) {
        if (qs && qs.rawData && qs.rawData.content) {
          const commentDiv = document.createElement("div");
          commentDiv.className = "question";

          commentDiv.innerHTML += `<h2><a href='https://www.khanacademy.org/profile/${qs.author.kaid}' target='_blank'>${qs.author.nickname}</a></h2><p>${qs.created}</p>`;
          //console.log(tipAndThank);

          const pElement = document.createElement("p");
          pElement.textContent = qs.text;
          commentDiv.appendChild(pElement);
          commentDiv.innerHTML += `<div><a href='#!'  class='thumbtn'><span class="material-symbols-rounded">thumb_up</span> ${qs.votes}</a> <a href='https://www.khanacademy.org/computer-programming/i/${selectedProgram.id}?qa_expand_key=${qs.key}&qa_expand_type=question' target='_blank' class='thumbtn'><span class="material-symbols-rounded">comment</span> ${qs.replyCount}</a></div>`;
          questionsHTML += commentDiv.innerHTML;
        }
      }
      document.getElementById("questions").innerHTML += questionsHTML;
    } else if (stats.questions.length === 0) {
      document.getElementById(
        "questions"
      ).innerHTML = `<div class='comment'>
    <h2 class='center'>No questions yet.</h2>

    </div>`;
    }
  }
}

function update(code, widths, heights, aceMod, demo = false) {
  var iframe = document.getElementById("iframe");
  const idoc = iframe.contentWindow.document;
  idoc.open();

  if (aceMod === "ace/mode/html") {
    idoc.write(code);
  } else if (aceMod === "ace/mode/javascript") {
    // Write the base HTML structure
    idoc.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title></title>
  <style>
      html, body, #wrapper {
          overflow: hidden;
          width: 100%;
          height: 100%;
          margin: 0px;
          padding: 0px;
          width: calc(100% + 1px);
      }
      canvas {
          width: fit-content;
          height: fit-content;
      }
      canvas:focus {
          outline: none;
      }
      #wrapper {
          padding: 0px;
          margin: 0px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
      }
  </style>
</head>
<body id="wrapper">

  <canvas class="sketch"></canvas>
</body>
</html>
`);
    idoc.close(); // Close the document to finalize the base HTML structure

    // Create and add external scripts
    const pjsScript = idoc.createElement("script");
    // pjsScript.src ="https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.js";
    pjsScript.src =
      "https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.min.js";
    pjsScript.onload = function () {
      // Once Processing.js is loaded, add the exporter script
      const exporterScript = idoc.createElement("script");
      exporterScript.src =
        "https://cdn.jsdelivr.net/gh/Mushy-Avocado/KA-exporter@v1.0.1/exporter.js";
      exporterScript.onload = function () {
        // Once both scripts are loaded, add the program script
        const programScript = idoc.createElement("script");
        programScript.type = "application/javascript";
        programScript.textContent = `
          function program() {
var Program = {
      restart: function(){
//window.location.reload.bind(window)		        
alert('Program restart is not available on Khan Profile Viewer yet. Please re-run the program manually or go to Khan Academy.');
      }
  };
              title("");
              size(${widths}, ${heights});
              ${code} 
          }
          runPJS(program);
      `;
        idoc.body.appendChild(programScript);
      };
      idoc.body.appendChild(exporterScript);
    };
    idoc.body.appendChild(pjsScript);
  } else if (aceMod === "ace/mode/sql") {
    idoc.write(
      "<h2>SQL programs are in beta testing. They currently cannot be run here.</h2>"
    );
    idoc.close();
  } else if (aceMod === "ace/mode/python") {
    idoc.write(
      "<h2>Python programs are in beta testing. They currently cannot be run here.</h2>"
    );
    idoc.close();
  } else {
    idoc.write(code);
    idoc.close();
  }

  iframe.style.width = `${widths}px`;
  iframe.style.height = `${heights}px`;

  if (demo === true) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(code1, 'text/html');
    document.getElementById("program-title").innerText = doc.title;
  } else {
    document.getElementById("program-title").innerText =
      filteredPrograms[
        document
          .querySelector(".programSelector.active")
          ?.getAttribute("data-index")
      ].title;
  }
}

function renderProgramSelectors() {
  const programSelectorsContainer =
    document.getElementById("programSelectors");
  programSelectorsContainer.innerHTML = "";
  filteredPrograms.forEach((program, index) => {
    const button = document.createElement("div");
    button.className = `programSelector ${program.classification}`;
    var strs =
      '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EAC452"><path d="M480-269 314-169q-11 7-23 6t-21-8q-9-7-14-17.5t-2-23.5l44-189-147-127q-10-9-12.5-20.5T140-571q4-11 12-18t22-9l194-17 75-178q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l75 178 194 17q14 2 22 9t12 18q4 11 1.5 22.5T809-528L662-401l44 189q3 13-2 23.5T690-171q-9 7-21 8t-23-6L480-269Z"/></svg>'.repeat(
        program.classification
      );
    if (program.classification === 0) {
      strs = '<span class="material-symbols-rounded">reviews</span>';
    }
    if (strs === undefined || strs === null) {
      strs = "";
      for (var i = 0; i < program.classification; i++) {
        strs += `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EAC452"><path d="M480-269 314-169q-11 7-23 6t-21-8q-9-7-14-17.5t-2-23.5l44-189-147-127q-10-9-12.5-20.5T140-571q4-11 12-18t22-9l194-17 75-178q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l75 178 194 17q14 2 22 9t12 18q4 11 1.5 22.5T809-528L662-401l44 189q3 13-2 23.5T690-171q-9 7-21 8t-23-6L480-269Z"/></svg>`;
      }
    }
    button.innerHTML = `<img src="https://www.khanacademy.org/computer-programming/i/${program.id}/${program.thumbnailID}.png" width="200" height="200">

              <div>
                  
                  <a href='#!'  class='thumbtn'><span class="material-symbols-rounded">favorite</span> ${program.votes}</a> <a href='#!' class='thumbtn'><svg width="20px" height="20px" viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M6 4C5.44772 4 5 4.44772 5 5C5 5.55228 5.44772 6 6 6C6.55228 6 7 5.55228 7 5C7 4.44772 6.55228 4 6 4ZM9 5C9 6.30622 8.16519 7.41746 7 7.82929V9C7 10.1046 7.89543 11 9 11C10.1947 11 11.2671 11.5238 12 12.3542C12.7329 11.5238 13.8053 11 15 11C16.1046 11 17 10.1046 17 9V7.82929C15.8348 7.41746 15 6.30622 15 5C15 3.34315 16.3431 2 18 2C19.6569 2 21 3.34315 21 5C21 6.30622 20.1652 7.41746 19 7.82929V9C19 11.2091 17.2091 13 15 13C13.8954 13 13 13.8954 13 15V16.1707C14.1652 16.5825 15 17.6938 15 19C15 20.6569 13.6569 22 12 22C10.3431 22 9 20.6569 9 19C9 17.6938 9.83481 16.5825 11 16.1707V15C11 13.8954 10.1046 13 9 13C6.79086 13 5 11.2091 5 9V7.82929C3.83481 7.41746 3 6.30622 3 5C3 3.34315 4.34315 2 6 2C7.65685 2 9 3.34315 9 5ZM12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18ZM18 6C18.5523 6 19 5.55228 19 5C19 4.44772 18.5523 4 18 4C17.4477 4 17 4.44772 17 5C17 5.55228 17.4477 6 18 6Z" fill="inherit"/>
</svg> ${program.spinOffCount}</a></div><a href="#!" class="rating">
    ${strs}
  </a>`;

    const titl = document.createElement("h2");
    titl.innerText = program.title;

    button.appendChild(titl);
    button.setAttribute("data-index", index);
    button.addEventListener("click", function () {
      scene(2);
      document
        .querySelectorAll(".programSelector")
        .forEach((el) => el.classList.remove("active"));
      button.classList.add("active");
      document.getElementById('selectProgram').style.display = 'none';
      setupEditor(index);

    });
    programSelectorsContainer.appendChild(button);
  });
}

function searchPrograms() {
  const searchTerm = document
    .getElementById("search")
    .value.toLowerCase();
  filteredPrograms = programDetails.filter((program) =>
    program.title.toLowerCase().includes(searchTerm)
  );
  renderProgramSelectors();
}
async function fetchUserDetails() {
  try {
    const client = new KhanAPI.Client();
    const user = await client.getUser(username);
    return user;
  } catch (error) {
    //console.error(error);
    return null;
  }
}
async function initialize(countLines) {


  if (countLines === 'html_demo') {
    setupEditor('html_demo');
    runCode();
  } else {

    programDetails = await fetchProgramDetails();
    if (!username || username.trim() === '') {
      return;
    } else if (programDetails.length === 0) {
      document.getElementById('throw').style.display = 'block';
      document.getElementById('throw').style.backgroundColor = '#232323';
      document.getElementById('throw').innerHTML = `
      <div style='padding:45px;'><h2>This user does not have any projects!</h2><p> Please enter a valid username with public projects on their profile. Press <b>Home</b> to go back.</p><a href='https://khanprofileviewer.web.app/'><button style='display:block;margin-top:45px;'><span class="material-symbols-rounded">home</span> Home</button></a></div>`;
      return;
    }
    filteredPrograms = programDetails;
    renderProgramSelectors();
    if (programDetails.length > 0) {
      
      userDetails = await fetchUserDetails();
      console.log(userDetails);
      document.getElementById('user-profile').innerHTML = `
      <h1>@${username}</h1>
      <p>Nickname: ${userDetails.nickname?userDetails.nickname:"This user's nickname is not public."}</p>
      <p style='padding: 14px;background-color:rgba(255,255,255,0.2);border-radius:8px;'>${userDetails.bio?userDetails.bio:"This user's bio is not public."}</p>
      <ul>
      <li>${programDetails.length} Public Programs</li>
      <li>${userDetails.joined?"Account Created " + userDetails.joined:"<em>This user's join date is not public.</em>"}</li>
     
      <li>${userDetails.points?userDetails.points + " Experience Points":"<em>This user's points are not public.</em>"}
      </li>
      <li><b>User Badges</b>: ${userDetails.badgeCounts ? Object.entries({ 0: "Challenge Patches", 1: "Black Hole Badges", 2: "Sun Badges", 3: "Earth Badges", 4: "Moon Badges", 5: "Meteorite Badges" }).map(([k, v]) => userDetails.badgeCounts[k] > 0 ? `${v}: ${userDetails.badgeCounts[k]}` : "").filter(Boolean).join(", ") || "<em>No badges</em>" : "<em>This user's badges are not public.</em>"}</li>
     
      <li>Sharable <a href='https://khanprofileviewer.web.app/?user=${username}' target='_blank'><b>Khan Profile Viewer</b></a> link
      </li>
      <li><a href='https://www.khanacademy.org/profile/${userDetails.kaid}/' target='_blank'><b>Khan Academy</b></a> Profile Permalink</li>
      
      </ul>
      <button onclick='location.reload();' class='btn-outlined'>Logout</button>
      `;
      if (countLines === 'ok') {
        // stay in program
      }


      else if (countLines === true) {
        let l = 0;
        // Loop through programDetails and fetch data for each program
        for (var i = 0; i < programDetails.length; i++) {
          var c = programDetails[i].id;
          var a = new KhanAPI.Client();
          var w = await a.getProgram(c);

          // Await the result of ddd for each programId
          var lines = c;

          // Add the result to the accumulated total
          if (lines !== null) {
            l += w.lines;
            ZZZZ(
              "block",
              `<h2>COUNTLINES MODE:</h2> Programs Scanned: ${i}/${programDetails.length
              } <br/> Total Lines: ${l} lines of code <br/> Avg. Lines of Code per Program: ${(
                l / i
              ).toFixed(2)} lines of code`
            );
          } else {
            ZZZZ(
              "block",
              ` Error detected while trying to count total lines of code. Please refresh page.`
            );
          }
        }
      } else {

        setupEditor(0);
        document.querySelectorAll(".programSelector")[0].classList.add("active");
      }
    }
  }
}
function openComments() {
  document.getElementById("comments").style.display = "block";
  document.getElementsByClassName("navbar-flex-link")[0].className =
    "navbar-flex-link active";
  document.getElementsByClassName("navbar-flex-link")[1].className =
    "navbar-flex-link";
  document.getElementById("questions").style.display = "none";
}
function openQuestions() {
  document.getElementById("comments").style.display = "none";
  document.getElementsByClassName("navbar-flex-link")[1].className =
    "navbar-flex-link active";
  document.getElementsByClassName("navbar-flex-link")[0].className =
    "navbar-flex-link";
  document.getElementById("questions").style.display = "block";
}
openComments();
function ZZZZ(display, code) {
  document.getElementById("zzzz-text").innerHTML = code;
  document.getElementById("zzzz").style.display = display;
}
ZZZZ("none", "");
window.onload = function () {
  //initialize('html_demo');
};
document
  .getElementById("search")
  .addEventListener("input", searchPrograms);

function runCode() {

  const programIndex = document
    .querySelector(".programSelector.active")
    ?.getAttribute("data-index");
  if (programIndex === undefined) {
    const editor1 = ace.edit("editor");
    const code1 = editor1.getValue();
    update(
      code1,
      600, 600, 'ace/mode/html', true
    );
  } else if (programIndex !== null) {
    const editor = ace.edit("editor");
    const code = editor.getValue();
    const selectedProgram = filteredPrograms[programIndex];
    //No need to update since title can only be changed through KA
    //document.getElementById('program-title').innerText = filteredPrograms[document.querySelector('.programSelector.active')?.getAttribute('data-index')].title;

    update(
      code,
      selectedProgram.width,
      selectedProgram.height,
      selectedProgram.type,
      false
    );
  }
}

document
  .getElementById("runButton")
  .addEventListener("click", function () {
    runCode();
  });




scene(0);