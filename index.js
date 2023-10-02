const express = require("express");
const axios = require("axios");
const _ = require("lodash");
const app = express();
const { BLOG_API, SECRET } = require("./variables"); // Change the path as needed

app.get("/api/blog-stats", async (req, res, next) => {
  try {
    req.blogData = await fetchPosts();
    next();
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching blog data" });
  }
});

app.use("/api/blog-stats", (req, res, next) => {
  try {
    const articles = req.blogData.blogs;

    const totalArticles = _.size(articles);
    const longestTitle = _.maxBy(articles, (item) => item.title.length).title;
    const privacyCount = _.filter(articles, (item) =>
      item.title.toLowerCase().includes("privacy")
    ).length;
    const uniqueTitles = _.uniq(_.map(articles, "title"));

    req.stats = {
      success: true,
      totalArticles,
      longestTitle,
      privacyCount,
      uniqueTitles,
    };
    res.status(200).json({
      success: true,
      message: "Successfully analyzed blog data",
      data: req.stats,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error analyzing blog data." });
  }
});

app.get("/api/blog-search", async (req, res) => {
  const query = req.query.query;
  try {
    const data = await fetchPosts();

    const filteredPosts = _.filter(data.blogs, (post) =>
      RegExp(query, "i").test(post.title)
    );

    res.status(200).json({ success: true, data: filteredPosts });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error while searching blogs." });
  }
});

app.use((err, req, res, next) => {
  res
    .status(500)
    .json({ success: false, message: `Server error: ${err.message}` });
});

const fetchPosts = _.memoize(async () => {
  const { data } = await axios.get(BLOG_API, {
    headers: { "x-hasura-admin-secret": SECRET },
  });
  return data;
});

const PORT = process.env.PORT || 10;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
