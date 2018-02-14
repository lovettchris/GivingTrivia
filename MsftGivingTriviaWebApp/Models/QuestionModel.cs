using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace MsftGivingTriviaWebApp.Models
{

    [Table("Questions")]
    public class QuestionModel
    {
        public QuestionModel() { }
        public Guid Id { get; set; }
        public string Category { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
        public string Wrong1 { get; set; }
        public string Wrong2 { get; set; }
        public string Wrong3 { get; set; }
    }
}