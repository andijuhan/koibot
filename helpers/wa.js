const data = require('../data/data');

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
      dateStyle: 'short',
      timeStyle: 'short',
   });
   return currentDate;
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
};
