using BookCatalog.Models.DTOs;
using BookCatalog.Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BookCatalog.Data.Repositories;

namespace BookCatalog.Business.Services
{
    public class BookService : IBookService
    {
        private readonly IBookRepository _repository;

        public BookService(IBookRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<BookDto>> GetAllAsync()
        {
            var books = await _repository.GetAllAsync();
            return books.Select(b => new BookDto
            {
                Id = b.Id,
                Title = b.Title,
                AuthorName = b.Author?.Name,
                CategoryName = b.Category?.Name,
                Price = b.Price
            });
        }

        public async Task<BookDto> GetByIdAsync(int id)
        {
            var b = await _repository.GetByIdAsync(id);
            if (b == null) return null;
            return new BookDto
            {
                Id = b.Id,
                Title = b.Title,
                AuthorName = b.Author?.Name,
                CategoryName = b.Category?.Name,
                Price = b.Price
            };
        }

        public async Task AddAsync(BookDto bookDto)
        {
            var book = new Book
            {
                Title = bookDto.Title,
                Price = bookDto.Price,
                AuthorId = 1,    // TODO: map proper author
                CategoryId = 1   // TODO: map proper category
            };
            await _repository.AddAsync(book);
        }

        public async Task UpdateAsync(BookDto bookDto)
        {
            var book = await _repository.GetByIdAsync(bookDto.Id);
            if (book == null) return;

            book.Title = bookDto.Title;
            book.Price = bookDto.Price;
            // TODO: update author/category if needed

            await _repository.UpdateAsync(book);
        }

        public async Task DeleteAsync(int id)
        {
            await _repository.DeleteAsync(id);
        }
    }
}