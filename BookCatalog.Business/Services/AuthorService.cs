using BookCatalog.Data.Repositories;
using BookCatalog.Models.DTOs;
using BookCatalog.Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BookCatalog.Business.Services
{
    public class AuthorService : IAuthorService
    {
        private readonly IAuthorRepository _repository;

        public AuthorService(IAuthorRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<AuthorDto>> GetAllAsync()
        {
            var authors = await _repository.GetAllAsync();
            return authors.Select(a => new AuthorDto
            {
                Id = a.Id,
                Name = a.Name
            });
        }

        public async Task<AuthorDto> GetByIdAsync(int id)
        {
            var a = await _repository.GetByIdAsync(id);
            if (a == null) return null;
            return new AuthorDto
            {
                Id = a.Id,
                Name = a.Name
            };
        }

        public async Task AddAsync(AuthorDto authorDto)
        {
            var author = new Author
            {
                Name = authorDto.Name
            };
            await _repository.AddAsync(author);
        }

        public async Task UpdateAsync(AuthorDto authorDto)
        {
            var author = await _repository.GetByIdAsync(authorDto.Id);
            if (author == null) return;

            author.Name = authorDto.Name;

            await _repository.UpdateAsync(author);
        }

        public async Task DeleteAsync(int id)
        {
            await _repository.DeleteAsync(id);
        }
    }
}
