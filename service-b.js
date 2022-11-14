const tracer = require('./tracing')('service-b');
const express = require("express");
const PORT = "8081";
const app = express();

app.get("/api/reportOther", (req, res) => {
  try {
    let span = tracer.startSpan('handle_report_other');
    span.end()
    res.send({ "other": "context" });
  } catch (e) {
    res.send(e);
  }
});

app.listen(parseInt(PORT, 10), () => {
  console.log(`Service B listening for requests on http://localhost:${PORT}`);
});