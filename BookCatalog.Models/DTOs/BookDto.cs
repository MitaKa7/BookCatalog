using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BookCatalog.Models.DTOs
{
    public class BookDto
    {
        public int Id { get; set; }
        public string Title { get; set; }

        // For POST: select Author by Id
        public int AuthorId { get; set; }

        // For POST: select Category by Id
        public int CategoryId { get; set; }

        // For GET: show names in table
        public string AuthorName { get; set; }
        public string CategoryName { get; set; }

        public decimal Price { get; set; }
    }
}

