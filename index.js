var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));


//Server index page
app.get("/", function (req, res) {
  res.send("Deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  }
});


// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) 
{
  // Make sure this is a page subscription
  if (req.body.object == "page") 
  {
    // Iterate over each entry
    // There may be multiple entries if batched
    req.body.entry.forEach(function(entry) 
	{
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) 
	  {
	  
        if (event.postback) 
		{
          processPostback(event);
        }
		if(event.message)
		{
		   
		   var msg_text=event.message.text.toLowerCase();
		   var first_word="";
		   var rest_string="";
		   if(msg_text.indexOf(" ")===-1)
		   {
		    first_word=msg_text;
		   }
		   else
		   {
		      first_word=msg_text.substr(0,msg_text.indexOf(" "));
			//Here rest_string for news chanel for temporary
			  rest_string=msg_text.substr(msg_text.indexOf(" ")+1,msg_text.length-1);
			  
		   }
		   
		   switch(first_word)
		   {
		    case "news":getNews(event,rest_string);
			            break;
			case "joke":getJoke(event,rest_string);
			            break;
	        case "quote":getQuote(event);
                         break;
            default:
                    sendMessage(event.sender.id,{text: "Ohh ! you didn't follow my rule."});			
		   }
		
		}
      });
    });

    res.sendStatus(200);
  }
});

var newsChanels={
 hindu:'the-hindu',
 bbcnews:'bbc-news',
 espn:'espn',
 techcrunch:'techcrunch',
 time:'time',
 economist:'the-economist',
 hackernews:'hacker-news'
};


function getNews(event,chanelName)
{
  var senderid=event.sender.id;
  if(chanelName=="")
  {
    sendMessage(senderid,{text:"Please!Provide chanelname."});
  }
  else if(chanelName in newsChanels)
  {   
   var chanel=newsChanels[chanelName];
   var params={
    url:'https://newsapi.org/v1/articles?source='+chanel+'&apiKey='+process.env.NEWS_API_KEY,
	
    method:'GET'
	};
  request(params,function(error,response,body)
        {
           if(error)
		   {
		     console.log("Error getting user's name: " +  error);
			 sendMessage(senderid,{text:"Sorry! Internal problem"}); 
		   }
		   else
		   {
		     var bodyObj=JSON.parse(body);
             var len=bodyObj.articles.length;
			 var i=0;
			 var news="";
			 
			 while(Number(i)<Number(len))
			 {
	          var title_temp="";
			  var desc_temp="";
			  var url_temp="";
			  var news_temp="";
			  
			  title_temp=bodyObj.articles[i].title;
			  desc_temp=bodyObj.articles[i].description;
			  url_temp='for more detail '+bodyObj.articles[i].url;
			  news_temp=String(title_temp)+'.'+String(desc_temp)+'.'+String(url_temp)+'.\n\n';
			  //news=String(news)+String(news_temp)+;
              i++;
			  sendMessage(senderid,{text:news_temp});
			  
			 }
			  
			}
	   });
    }
	else 
	{
	     sendMessage(senderid,{text:"Please! give proper chanel name.\nHere are the chanels.\n1.Hindu\n2.BBCNews\n3.ESPN\n4.techcrunch\n5.Time\n6.Economist\n7.HackerNews"});
	}
}

//To fetch jokes.
function getJoke(event,restString)
{
   var senderid=event.sender.id;
  
   //If message is "joke"  
   if(restString=="")
   {
    sendRandomJoke(senderid,event); 
   }
   //If message is "joke <totaljoke>"
   else if(parseInt(restString))
   {
    sendFixNumberJoke(senderid,restString);
   }
   else if(checkType(restString))
   {
   //   sendMessage(senderid,{text:"ohh yar"});
     sendFixTypeOfJoke(senderid,restString);
   }
   else
   {
     sendMessage(senderid,{text:"Sorry ! you did wrong. Refer your first message for joke."}); 
   }
   
}


function checkType(restString)
{
  var Type=["nerdy","explicit","nerdy,explicit","explicit,nerdy"];
  if(Type.indexOf(restString)==-1)
  {
     
       return false;
  }
  else
  {
        return true;
  }
}

function sendRandomJoke(s_id,event)
{
    var params={
    url:'http://api.icndb.com/jokes/random/',
	
    method:'GET'
	};
  request(params,function(error,response,body)
        {
           if(error)
		   {
		     console.log("Error getting user's name: " +  error);
			 sendMessage(s_id,{text:"Sorry! Internal problem"});
		   }
		   else
		   {
		      var bodyObj=JSON.parse(body);
        	  var joke=bodyObj.value.joke;
              joke=joke.replace(/&quot;/g,'"');
              joke=joke.replace(/&amp;/g,'and');			  
			  sendMessage(s_id,{text:joke});
			}
	});
   
}

function sendFixNumberJoke(s_id,temp_tj)
{
   var params={
    url:'http://api.icndb.com/jokes/random/'+temp_tj,
	
    method:'GET'
	};
  request(params,function(error,response,body)
        {
           if(error)
		   {
		     console.log("Error getting user's name: " +  error);
			 sendMessage(s_id,{text:"Sorry! Internal problem"});
		   }
		   else
		   {
		      var i=0;
		      var bodyObj=JSON.parse(body);
			  while(Number(i)< Number(bodyObj.value.length))
			  {
        	  var joke=bodyObj.value[i].joke;	
			  joke=joke.replace(/&quot;/g,'"');
              joke=joke.replace(/&amp;/g,'and');			  
			  
			  i++;
			  sendMessage(s_id,{text:joke});
			  }
			}
	});
   
}

function sendFixTypeOfJoke(s_id,restString)
{
   var category=[];
   if(restString.indexOf(",")!=-1)
   {
     
     var first_type=restString.substr(0,restString.indexOf(","));
	 category.push(first_type);
	 var second_type=restString.substr(restString.indexOf(",")+1,restString.length-1);
	 category.push(second_type);
   }
   else
   {
     var type=restString;
	 category.push(type);
   }
   
   var params={
    url:'http://api.icndb.com/jokes/random?limitTo='+category,
	
    method:'GET'
	};
  request(params,function(error,response,body)
        {
           if(error)
		   {
		     console.log("Error getting user's name: " +  error);
			 sendMessage(s_id,{text:"Sorry! Internal problem"});
		   }
		   else
		   {
		      var i=0;
		      var bodyObj=JSON.parse(body);
			  var joke=bodyObj.value.joke;	
			  joke=joke.replace(/&quot;/g,'"');
              joke=joke.replace(/&amp;/g,'and');			  
			  sendMessage(s_id,{text:joke});
			}
	});
}

//To fetch Quote.
function getQuote(event)
{
   var senderid=event.sender.id;
   var quoteCategory=["inspire","life","funny","sports","love","art"];
   var category=quoteCategory[Math.floor(Math.random()*quoteCategory.length)];
   var params={
    url:'http://quotes.rest/qod.json?category='+category,
	
    method:'GET'
	};
  request(params,function(error,response,body)
        {
           if(error)
		   {
		     console.log("Error getting user's name: " +  error);
			 sendMessage(senderid,{text:"Sorry! Internal problem."});
		   }
		   else
		   {
		      
		      var bodyObj=JSON.parse(body);
			  var quote=bodyObj.contents.quotes[0].quote;
			  sendMessage(senderid,{text:quote});
			}
	});
}

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;

  if (payload === "Greeting") {
    // Get user's first name from the User Profile API
    // and include it in the greeting
    request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
	  //console.log("HIIIII");
      var message = greeting + "Hey! Are you bored? Here I am ! What would you like to read a joke,a news?\n\n"+
	  "For NEWS:\n\nsend 'news <chanelname>'.\n Here are the chanels.\n1.Hindu\n2.BBCNews\n3.ESPN\n4.techcrunch\n5.Time\n6.Economist\n7.HackerNews\n\n"+
      "For JOKE:\n\n1. joke\n2. joke <number of joke> e.g 'joke 5'\n3.For special category joke\nsend 'joke <nerdy | explicit | nerdy,explicit | explicit,nerdy>'\n\n"+
	  "For QUOTE:\n\n send 'quote'";
	  
      sendMessage(senderId,{text: message});
	   
    });
  }
}

// sends message to user
function sendMessage(recipientId, message) 
{
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}

