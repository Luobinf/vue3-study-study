// 使用微任务控制更新 job，使得响应式数据更新多次只会执行一次。
let jobQueue = new Set()
let isFlushing = false
let p = Promise.resolve()

function flushJob() {
  if(isFlushing) return
  isFlushing = true
  p.then(() => {
    jobQueue.forEach(job => {
      job && job()
    })
  }).finally(() => {
    isFlushing = false
  })
}