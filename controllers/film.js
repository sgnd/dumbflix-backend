const { Film, Category, Episode } = require("../models");
const Joi = require("@hapi/joi");
const { response } = require("express");

exports.getFilm = async (req, res) => {
  try {
    const { page: pageQuery, limit: limitQuery, categoryId } = req.query;

    const page = pageQuery ? parseInt(pageQuery) - 1 : 0;
    const pageSize = limitQuery ? parseInt(limitQuery) : 10;

    const paginate = ({ page, pageSize }) => {
      const offset = page * pageSize;
      const limit = pageSize;

      return {
        offset,
        limit,
      };
    };

    let filter = {};
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    const film = await Film.findAll(
      Object.assign(
        {
          where: filter,
        },
        {
          include: [
            /*{
													model: Episode,
													as: 'episodes',
													attributes: {
														exclude: ['createdAt', 'updatedAt', 'filmId', 'FilmId']
													}
												},*/
            {
              model: Category,
              as: "category",
              attributes: {
                exclude: ["createdAt", "updatedAt"],
              },
            },
          ],
          order: [["createdAt", "DESC"]],
          attributes: {
            exclude: ["createdAt", "updatedAt", "categoryId"],
          },
        },
        paginate({
          page,
          pageSize,
        })
      )
    );

    if (film) {
      return res.send({
        data: film,
        paginationInfo: {
          currentPage: page + 1,
          limit: limitQuery,
        },
      });
    } else {
      return res.status(400).send({
        error: {
          message: "Films Not Found",
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      error: {
        message: "Server Error",
      },
    });
  }
};

//gak pake tapi ini adalah hasMany Relationship
exports.getFilmEpisodeCategory = async (req, res) => {
  try {
    const { id: IdFilm } = req.params;

    const film = await Film.findAll({
      include: [
        {
          model: Episode,
          as: "episodes",
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: Category,
          as: "category",
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
      ],

      attributes: {
        exclude: ["createdAt", "updatedAt", "categoryId"],
      },
    });

    //return console.log(film);

    if (film) {
      return res.send({
        data: film,
      });
    } else {
      return res.status(400).send({
        message: "Films Not Found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      error: {
        message: "Server Error",
      },
    });
  }
};

exports.getDetailFilm = async (req, res) => {
  try {
    const { id } = req.params;
    const film = await Film.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Episode,
          as: "episodes",
          attributes: {
            exclude: ["createdAt", "updatedAt", "filmId", "FilmId"],
          },
        },
        {
          model: Category,
          as: "category",
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
      ],
      order: [[{ model: Episode, as: "episodes" }, "title", "ASC"]],
      attributes: {
        exclude: ["createdAt", "updatedAt", "categoryId"],
      },
    });

    if (film) {
      return res.send({
        data: film,
      });
    } else {
      return res.status(400).send({
        message: "Films Not Found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      error: {
        message: "Server Error",
      },
    });
  }
};

exports.addFilm = async (req, res) => {
  try {
    const schema = Joi.object({
      title: Joi.string().min(3).required(),
      year: Joi.string().required(),
      categoryId: Joi.required(),
      description: Joi.string().required(),
    });
    const { error } = schema.validate(req.body);

    if (error)
      return res.status(400).send({
        error: {
          message: error.details[0].message,
        },
      });

    const { categoryId } = req.body;

    const cekCategory = await Category.findOne({
      where: {
        id: categoryId,
      },
    });

    if (!cekCategory)
      return res.status(400).send({
        message: "Category Not Found",
      });

    const film = await Film.create({
      ...req.body,
      categoryId,
      thumbnailFilm: req.file.filename,
    });

    if (film) {
      const filmResult = await Film.findOne({
        where: {
          id: film.id,
        },
        include: {
          model: Category,
          as: "category",
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      });

      return res.send({
        data: filmResult,
      });
    } else {
      return res.status(400).send({
        message: "Please Try Again",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      error: {
        message: "Server Error",
      },
    });
  }
};

exports.editFilm = async (req, res) => {
  try {
    const schema = Joi.object({
      title: Joi.string().min(3).required(),
      thumbnailFilm: Joi.string().required(),
      year: Joi.required(),
      category: Joi.required(),
      description: Joi.string().min(10).required(),
    });
    const { error } = schema.validate(req.body);

    if (error)
      return res.status(400).send({
        error: {
          message: error.details[0].message,
        },
      });

    const { id } = req.params;

    const {
      category: { id: categoryId },
    } = req.body;

    const film = await Film.update(
      {
        ...req.body,
        categoryId,
      },
      {
        where: {
          id,
        },
      }
    );

    if (film) {
      const filmResult = await Film.findOne({
        where: {
          id,
        },
        include: {
          model: Category,
          as: "category",
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        attributes: {
          exclude: ["createdAt", "updatedAt", "categoryId"],
        },
      });
      return res.send({
        data: filmResult,
      });
    } else {
      return res.status(400).send({
        message: "Films Not Found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      error: {
        message: "Server Error",
      },
    });
  }
};

exports.deleteFilm = async (req, res) => {
  try {
    const { id } = req.params;
    const film = await Film.findOne({
      where: {
        id,
      },
    });

    if (film) {
      await Film.destroy({
        where: {
          id,
        },
      });

      return res.send({
        data: {
          id,
        },
      });
    } else {
      return res.status(400).send({
        message: "Film Not Found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      error: {
        message: "Server Error",
      },
    });
  }
};
