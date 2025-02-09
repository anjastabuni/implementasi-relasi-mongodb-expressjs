const path = require("path");
const express = require("express");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const app = express();

const ErrorHandler = require("./ErrorHandler");

// models
const Product = require("./models/product");
const { error } = require("console");

// connect to mongodb
mongoose
  .connect("mongodb://127.0.0.1/shop_db")
  .then((result) => {
    console.log("connected to mongodb");
  })
  .catch((err) => {
    console.log(err);
  });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const wrapAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

// roots
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/products", async (req, res) => {
  const { category } = req.query;
  if (category) {
    const products = await Product.find({ category });
    res.render("products/index", { products, category });
  } else {
    const products = await Product.find({});
    res.render("products/index", { products, category: "All" });
  }
});

app.get(
  "/products/create",
  wrapAsync((req, res) => {
    res.render("products/create");
  })
);

app.post(
  "/products",
  wrapAsync(async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.redirect(`/products/${product._id}`);
  })
);

app.get(
  "/products/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    res.render("products/show", { product });
  })
);

app.get(
  "/products/:id/edit",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    res.render("products/edit", { product });
  })
);

app.put(
  "/products/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { runValidators: true });
    res.redirect(`/products/${product._id}`);
  })
);

app.delete(
  "/products/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.redirect("/products");
  })
);

const validatorHandler = (err) => {
  err.status = 400;
  err.message = Object.values(err.errors)
    .map((item) => item.message)
    .join(", ");
  return err;
};

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") err = validatorHandler(err);
  if (err.name === "CastError") {
    err.status = 404;
    err.message = "Product not found";
  }

  res.status(err.status || 500).send(err.message || "Something went wrong");
});

// app.use((err, req, res, next) => {
//   console.dir(err);
//   if (err.name === "ValidationError") {
//     err.status = 400;
//     err.message = Object.values(err.errors).map((item) => item.message);
//   }
//   next(err);
// });

// app.use((err, req, res, next) => {
//   const { status = 500, message = "Something went wrong" } = err;
//   res.status(status).send(error);
// });

app.listen(3000, () => {
  console.log("shop app listening on http://127.0.0.1:3000");
});
