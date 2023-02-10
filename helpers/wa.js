const data = require('../data/data');
const date = require('date-and-time');

const getGroupId = (userChat) => {
   const groupObj = userChat
      .filter((chat) => chat.isGroup && chat.name === data.groupName)
      .map((chat) => {
         return {
            id: chat.id,
            name: chat.name,
         };
      });
   return groupObj[0].id.user + '@g.us';
};

const currentDateTime = () => {
   const currentDate = new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
   });
   return currentDate;
};

const addSomeMinutes = (minutes) => {
   const currentDate = new Date();
   const addMinutes = date.addMinutes(currentDate, minutes);
   const hourFormat = addMinutes.toLocaleString('id-ID', {
      timeStyle: 'short',
   });
   return hourFormat;
};

const generateFishCode = (num) => {
   if (num > 0 && num <= 20) {
      const alpha = Array.from(Array(num)).map((e, i) => i + 65);
      const alphabet = alpha.map((x) => String.fromCharCode(x));
      return alphabet;
   }
};

module.exports = {
   getGroupId,
   currentDateTime,
   generateFishCode,
   addSomeMinutes,
};
