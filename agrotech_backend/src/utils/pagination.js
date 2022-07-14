const getPagingData = (list, page, limit, totalcount) => {
  const total = totalcount;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(total / limit);
  const sNo=[];
  let intial ;
  let res ;
  if(limit==0){
   intial = (total-1)
    res = (page*total)
  }else{
   res = (page*limit)
   intial = (limit-1)
  }
  for(let i= intial; i>=0; i--){
     //console.log(sNo.push(i))
     sNo.push(res-i)
  }
  //console.log("page",totalPages)
  const pageMeta = {};
  if(limit==0){
    let totalPage=1
    pageMeta.size = total;
    pageMeta.page = currentPage;
    pageMeta.total = total;
    pageMeta.totalPages = totalPage;
    pageMeta.sNo = sNo
  }else{
  pageMeta.size = limit;
  pageMeta.page = currentPage;
  pageMeta.total = total;
  pageMeta.totalPages = totalPages;
  pageMeta.sNo = sNo
  }
  return {
    pageMeta,
    list
  };
};

module.exports = getPagingData;