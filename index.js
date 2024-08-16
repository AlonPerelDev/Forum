import express from "express";
import bodyParser from "body-parser";
import * as fs from 'fs';
import bcrypt from 'bcrypt';
const app = express();
const port = 3000;

console.log("*******************************Initializing*******************************************************")

app.use(express.json())
const users = [];
app.get('/users', (req, res) => {
	res.json(users)
})

app.post('/users', async (req,res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10)
		const user = { name: req.body.name, password: hashedPassword }
		const userExistability = users.find(user => user.name = req.body.name)
		users.push(user)
		res.status(201).send()
	} catch {
		res.status(500).send()		
	}
})
app.post('/users/login', async (req,res) => {
	const user = users.find(user => user.name = req.body.name)
	if (user == null) {
		return res.status(400).send('Cannot find user')
	}
	try {
		if(await bcrypt.compare(req.body.password, user.password)) {
			res.send('Success')
		} else {
			res.send('Not Allowed')
		}
	} catch {
		res.status(500).send()
	}
})


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

class Post {
	constructor(postID, topic, content, replies, paths){
		this.postID = postID;
		this.topic = topic;
		this.content = content;
		this.replies = replies;
		this.paths = paths;
		this.repliesCounter = 0;
		this.level = 0;
	}
}

class Reply {
	constructor(originalPostID, replyID, replyingToID, content, replies, level){
		this.originalPostID = originalPostID
		this.replyID = replyID;
		this.replyingToID = replyingToID;
		this.content = content;
		this.replies = replies;
		this.repliesCounter = 0;
		this.level = level;
  	}
}

class PostsTree {
	constructor(){
		this.postsList = [];
		this.last = 0
	}
	
	insertPost(topic, content){
		let postID = "P" + (this.postsList.length + 1)
		let path = "postsList[" + this.postsList.length + "]"
		var newPost = new Post(postID, topic, content,[],{});
		this.last += 1;
		this.postsList.push(newPost)
		this.postsList[this.postsList.length-1].paths[postID] = path

	}
	
	insertReply(originalPostID, replyingToID, content){
		console.log("**************Inserting Reply************")
		//console.log(this.postsList[originalPostID.slice(1)-1].paths[replyingToID])
		//console.log("insertReply(): this.postsList[0].paths",this.postsList[0].paths)
		//let originalPostPath = this.postsList[originalPostID.slice(1)-1].paths[originalPostID] //original thread path
		//console.log("insertReply() originalPostID:",originalPostID,"originalPostID.slice(1)",originalPostID.slice(1))
		let pathOfRespondingTo = this.postsList[originalPostID.slice(1)-1].paths[replyingToID] //path to the thing being responded to
		console.log("insertReply(pathOfRespondingTo): ",pathOfRespondingTo)
		let level = Object.byString(tree, pathOfRespondingTo + ".level") + 1
		console.log("insertReply(level): ",level)
		//let path = pathOfRespondingTo + ".replies[" + this.postsList[originalPostID.slice(1)-1].repliesCounter + "]" //path of this response
		let path = pathOfRespondingTo + ".replies[" + Object.byString(tree, pathOfRespondingTo + ".repliesCounter") + "]" //path of this response
		this.postsList[originalPostID.slice(1)-1].repliesCounter += 1
		if (originalPostID !== replyingToID){ // this adds to the repliesCounter of replies, not posts. 
			let replyCounter = Object.byString(tree, pathOfRespondingTo)
			replyCounter.repliesCounter +=1
			//console.log("adding to replies counter",JSON.stringify(pathOfRespondingTo))
			//console.log(this.postsList[0].replies[0].repliesCounter)
		}
		let replyID = "R" + (this.postsList[originalPostID.slice(1)-1].repliesCounter)
		var newReply = new Reply(originalPostID, replyID, replyingToID, content, [], level)
		let pathToPushInto = Object.byString(tree, pathOfRespondingTo + ".replies")
		console.log("insertReply(originalPostID): ",originalPostID, "insertReply(replyID): ", replyID, "insertReply(replyingToID): ", replyingToID, content, [], level, pathToPushInto)
		pathToPushInto.push(newReply)
		this.postsList[originalPostID.slice(1)-1].paths[replyID] = path
		console.log("insertReply(): Creating a new reply, with the level of: ",newReply.level)
		console.log("insertReply(): this.postsList[0].paths",this.postsList[0].paths)
	}
}

var tree = new PostsTree();
tree.insertPost("FirstTopic", "Lorem Ipsum is simply dummy text ong software like Aldus PageMaker including versions of Lorem Ipsum.")
tree.insertPost("SecondTopic", "Second content")
tree.insertReply("P1", "P1", "Reply1 to 1st post l1")  // (originalPostID, replyingToID, content)
tree.insertReply("P1", "R1", "Reply1 to 1st reply l2")


var postTreeBecomesABeautifulButterflu;
var textFileToVariableToTree = []

function updateTree() {
	postTreeBecomesABeautifulButterflu = JSON.stringify(tree);
	fs.writeFileSync("sample.txt", postTreeBecomesABeautifulButterflu , {encoding:'utf8',flag:'w'}, function (err) {
  		if (err) {
		    return console.error(err);
	  	}
	});
	textFileToVariableToTree = JSON.parse(fs.readFileSync("sample.txt", 'utf8' ))
	posts2 = textFileToVariableToTree;
	console.log("updateTree(): Tree of posts Updated, possibly even succesfully.")
}

updateTree()

var posts2 = textFileToVariableToTree
app.get("/", (req, res) => {
  res.render('index.ejs', {var: posts2});
});

app.post("/submit", (req, res) => {
  console.log(req.body["fname"],req.body["text"],req.body["id"])
  console.log(req.body)
  res.render('index.ejs', {var: posts2});
});

app.post("/submitReply", (req, res) => {
	let replyingToFullID = req.body["id"]
	let originalPostID = replyingToFullID.split(/(?=R)/g)[0]//.join("")
	let replyingToID = replyingToFullID.split(/(?=R)/g)[1]
	let content = req.body[replyingToFullID][1]
	if (replyingToID === undefined) { // when replying to a post, the "replyign to" isn't P1R1 or whatever, it's jsut P1, so split doesn't clean up the IDs. 
		// alternatively to this function, I could just wor on a better splitting mechanism I suppose. Is this bad coding practice? Is this spaghetti code?
		// I don't know... I'll improve it... later... Uhhh... TechDebt? xD I get it tho. I have other things to work on, and this now... "works..."
		replyingToID = originalPostID.slice(1, -1)
		originalPostID = originalPostID.slice(1,-1)
	} 
	console.log("app.post/submitReply: ",originalPostID, replyingToID, content)
	tree.insertReply(originalPostID, replyingToID, content)
	//console.log("tree.postslist[0]:",tree.postsList[0])
	updateTree()
    //console.log(originalPostID,replyingToID,content)

	res.render('index.ejs', {var: posts2});
});

app.post("/submitNewPost", (req, res) => {
	let fullID = req.body["id"]
	let content = req.body[fullID][1]
	let topic = req.body[fullID][0]
	//console.log("app.post/submitReply: ",fullID, content,topic)
	
	tree.insertPost(topic, content)
	updateTree()
    console.log(topic,content)

	res.render('index.ejs', {var: posts2});
});

app.post("/reply", (req, res) => {
  console.log(req.body["id"])
  res.render('index.ejs', {var: posts2});
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

console.log("*********************************Initialized***************************************")
