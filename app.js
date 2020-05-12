//jshint esversion:6

// packages required..
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// connect to mongodb..
mongoose.connect("mongodb+srv://sanath_1515:Sanath@1515@cluster0-cxgw6.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true});

// creating an object..
const itemSchema = {
  name: String,
}

// creating a model ..
const Item = mongoose.model("Item", itemSchema);

// creating three default items item1,item2,item3
const item1 = new Item({
  name: "buy food"
});
const item2 = new Item({
  name: "cook food"
});
const item3 = new Item({
  name: "eat food"
});

// creating default array
defArray = [item1, item2, item3];

// we create a list schema for dynamic purpose . we can access anything like localhost:3000/work,home.school etc;
// to create those dynamic pages using route parameters we create a list consisting a name and array to know what are the objects present in it;
const listSchema = {
  name:String,
  items:[itemSchema],
};

// create a dynamic model
const List = mongoose.model("List",listSchema);

// when we get to the home route then we should display what are the objects present in it.
// Item is the collection created by model and then we will display all the itesm from the database using mongo find()

app.get("/", function(req, res) {

  // const day = date.getDate();
  Item.find(function(err, itemSet) {
    // if we already reload the website then there are default elements inserted in the itemset then length will not be equal to 0
    // if it is not called then list is empty so we have to insert the elements into the list using insertMany
    if (itemSet.length === 0) {
      Item.insertMany(defArray, function(err) {
        if (err)
          console.log(err);
        else
          console.log("Succesfull....!");
        });
      res.redirect("/");
    } else {
      // if it is already has some elements we display those elements using list.ejs
      res.render("list", {
        listTitle: "today",
        newItems: itemSet
      });
    }
  });
});

// adding an element called by list.ejs using form action
app.post("/", function(req, res)
 {
   const newone = req.body.newItem;
   const newList = req.body.list;

   const newitem =new Item({
     name:newone,
   });
// if block is executed when it is static
  if(newList==="today")
  {
    newitem.save();
    res.redirect("/");
  }
// else block is executed when it is dyanamic
  else
  {
  // so as per dynamic we have list schema consists of a name and defArray
  // using findOne we find the name of the list in List model(i.e.., collection) and we add the new item to the corresponding list array(i.e.., items)
    List.findOne({name:newList},function(err,foundList)
    {
      if(!err)
      {
        foundList.items.push(newitem);
        foundList.save();   // we save the list
        res.redirect("/"+newList);    // we redirect back to the same page
      }
    })
  }
});

// deleting of an element called by form action list.ejs action="/delete"

app.post("/delete",function(req,res)
{
  const checkedItem=req.body.checkbox;
  const list=req.body.list; // we get this list name from the list title given by an hidden input so that we can get the list name and object.
  // after that we can know to delete the corresponding item from the corresponding list name

  // if block for static
  if(list==="today")
  {
    Item.findByIdAndRemove(checkedItem,function(err)
    {
  if(err)
    console.log(err);
  else
    console.log("deleted successfully!");
    })
  res.redirect("/");
  }
  // else block for dynamic depending on the list name the id element will be deleted
  else
  {
    // we use the below line bcoz now all the dyanamic lists are stored List model so it consist of two parameters listname and an array of coresponding objects of itemSchema
    // first we will go List collection and then we will search for the list in List with the name list and after finding that list we have to remove the element with the following id(i.e.,checkedItem)
    // this can be done using js by writing multiple for loops so to avoid that there is efficent way call $pull
     // which can be used to remove and there are many which can be found in mongoose documentation.
    List.findOneAndUpdate({name:list},{$pull:{items:{_id:checkedItem}}},function(err)
    {
      if(err)
        console.log(err);
      else
        console.log("deleted successfully!");
    })
    res.redirect("/"+list);
  }
})

app.get("/:topic",function(req,res)
{
  const listName=lodash.capitalize(req.params.topic);

List.findOne({name:listName},function(err,foundList)
{
  if(!err)
  {
    if(!foundList)
    {
      const list = new List({
        name:listName,
        items:defArray,
      })
      list.save();

      res.redirect("/"+listName);
    }
    else
    {
      // if list already exists
      res.render("list", {
        listTitle: listName,
        newItems: foundList.items,
      });
    }
  }
})
});


// to make listen local host to the server
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
