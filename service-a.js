const api = require('@opentelemetry/api');
const tracer = require('./tracing')('service-a');
const express = require("express");
const PORT = "8080";
const app = express();
const axios = require('axios')
const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

async function reportA() {
  let span = tracer.startSpan('report_a')
  await waitFor(500);
  span.setAttribute('report', 'A')
  span.recordException(new Error('Report A not found'))
  span.setStatus({ code: api.SpanStatusCode.ERROR, message: "Something wrong!" })
  span.addEvent('log', {
    'log.severity': 'error',
    'log.message': 'Report A not found',
    'endReport.id': '123',
  })
  span.end()
  throw "Report A not found";
}
async function reportB() {
  return await tracer.startActiveSpan('report_b', async (span) => {
    await waitFor(100);

    let child1 = tracer.startSpan('report_b_1')
    child1.end()
    let child2 = tracer.startSpan('report_b_2')
    child2.end()

    span.setAttribute('report', 'B')
    span.end()
    return { "b": "context" }
  })
}
async function reportC() {
  let span = tracer.startSpan('report_c')
  await waitFor(2000);
  span.setAttribute('report', 'C')
  span.end()
  return { "c": "context" }
}
async function reportOther() {
  try {
    let span = tracer.startSpan('report_other_request');
    let result;
    await api.context.with(api.trace.setSpan(api.context.active(), span),async () => {
      const { data } = await axios.get(`http://localhost:8081/api/reportOther`);
      result = data;
    });
    span.end()
    return result
  } catch (e) {
    throw e
  }
}
app.get("/api/allReports", async (req, res) => {
  tracer.startActiveSpan('gen_all_reports', async (span) => {
    const promises = [
      reportA(),
      reportB(),
      reportC(),
      reportOther()
    ];
    let result = await Promise.allSettled(promises);
    span.end()
    res.send(result);
  })
});
app.get("/api/reportA", async (req, res) => {
  try {
    let result = await reportA()
    res.send(result);
  } catch (e) {
    res.send(e);
  }
});
app.get("/api/reportB", async (req, res) => {
  try {
    let result = await reportB()
    res.send(result);
  } catch (e) {
    res.send(e);
  }
});
app.get("/api/reportC", async (req, res) => {
  try {
    let result = await reportC()
    res.send(result);
  } catch (e) {
    res.send(e);
  }
});

app.listen(parseInt(PORT, 10), () => {
  console.log(`Service A listening for requests on http://localhost:${PORT}`);
});